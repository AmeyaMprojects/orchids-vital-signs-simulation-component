import tensorflow as tf
import numpy as np
import cv2
import sys
import json
import base64
from io import BytesIO
from PIL import Image
import os
import warnings
import logging

# Suppress all warnings and TensorFlow logging
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
warnings.filterwarnings('ignore')
logging.getLogger('tensorflow').setLevel(logging.ERROR)

# Monkey-patch Keras Dense layer to ignore quantization_config
original_dense_init = tf.keras.layers.Dense.__init__

def patched_dense_init(self, *args, **kwargs):
    # Remove quantization_config if present
    kwargs.pop('quantization_config', None)
    original_dense_init(self, *args, **kwargs)

tf.keras.layers.Dense.__init__ = patched_dense_init

# Load model
model_path = os.path.join(os.path.dirname(__file__), "pneumonia_binary_model.h5")
try:
    model = tf.keras.models.load_model(model_path, compile=False)
except Exception as e:
    print(json.dumps({"error": f"Model loading failed: {str(e)}"}))
    sys.exit(1)

LAST_CONV_LAYER = "block_13_expand_relu"

def make_gradcam_heatmap(img_array, model, last_conv_layer_name):
    grad_model = tf.keras.Model(
        [model.inputs],
        [model.get_layer(last_conv_layer_name).output, model.output]
    )

    with tf.GradientTape() as tape:
        conv_outputs, predictions = grad_model(img_array)
        loss = predictions[:, 0]

    grads = tape.gradient(loss, conv_outputs)
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

    conv_outputs = conv_outputs[0]
    heatmap = conv_outputs @ pooled_grads[..., tf.newaxis]
    heatmap = tf.squeeze(heatmap)

    heatmap = tf.maximum(heatmap, 0)
    heatmap /= tf.reduce_max(heatmap)

    return heatmap.numpy()

def preprocess_image(img_path):
    img = tf.keras.preprocessing.image.load_img(
        img_path, target_size=(224, 224)
    )
    img_array = tf.keras.preprocessing.image.img_to_array(img)
    img_array = img_array / 255.0
    return np.expand_dims(img_array, axis=0), img

def overlay_heatmap_dynamic(
    heatmap,
    img,
    prediction_label,
    alpha_pneumonia=0.45,
    alpha_healthy=0.18
):
    heatmap = cv2.resize(heatmap, (img.size[0], img.size[1]))
    heatmap = np.clip(heatmap, 0, 1)
    heatmap_uint8 = np.uint8(255 * heatmap)

    if prediction_label == "PNEUMONIA":
        heatmap_color = cv2.applyColorMap(
            heatmap_uint8, cv2.COLORMAP_HOT
        )
        alpha = alpha_pneumonia
    else:
        heatmap_color = cv2.applyColorMap(
            heatmap_uint8, cv2.COLORMAP_SUMMER
        )
        alpha = alpha_healthy

    heatmap_color = cv2.cvtColor(heatmap_color, cv2.COLOR_BGR2RGB)
    img = np.array(img)
    overlay = cv2.addWeighted(
        img, 1 - alpha,
        heatmap_color, alpha,
        0
    )

    return overlay

def apply_lung_mask(heatmap):
    h, w = heatmap.shape
    mask = np.zeros((h, w), dtype=np.uint8)
    center = (w // 2, h // 2)
    axes = (int(w * 0.35), int(h * 0.45))

    cv2.ellipse(
        mask,
        center,
        axes,
        angle=0,
        startAngle=0,
        endAngle=360,
        color=1,
        thickness=-1
    )

    return heatmap * mask

def process_xray(img_path):
    img_array, raw_img = preprocess_image(img_path)
    
    # Suppress TensorFlow output during prediction
    import logging
    logging.getLogger('tensorflow').setLevel(logging.ERROR)
    
    # Predict with verbose=0 to suppress progress bars
    prob = model.predict(img_array, verbose=0)[0][0]
    label = "PNEUMONIA" if prob >= 0.25 else "NORMAL"

    heatmap = make_gradcam_heatmap(img_array, model, LAST_CONV_LAYER)
    heatmap = apply_lung_mask(heatmap)

    overlay = overlay_heatmap_dynamic(
        heatmap,
        raw_img,
        prediction_label=label
    )

    # Convert overlay to base64
    overlay_pil = Image.fromarray(overlay.astype('uint8'))
    buffered = BytesIO()
    overlay_pil.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()

    return {
        "label": label,
        "probability": float(prob),
        "image": img_str
    }

if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            print(json.dumps({"error": "No image path provided"}))
            sys.exit(1)
        
        img_path = sys.argv[1]
        
        if not os.path.exists(img_path):
            print(json.dumps({"error": f"Image file not found: {img_path}"}))
            sys.exit(1)
        
        result = process_xray(img_path)
        # Only output clean JSON to stdout
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": f"Processing failed: {str(e)}"}))
        sys.exit(1)
