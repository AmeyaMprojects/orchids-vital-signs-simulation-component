import tensorflow as tf
import numpy as np
import cv2
import matplotlib.pyplot as plt

model = tf.keras.models.load_model(r"models\pneumonia_binary_model.h5")

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
    # Resize heatmap to image size
    heatmap = cv2.resize(heatmap, (img.size[0], img.size[1]))

    # Normalize heatmap properly
    heatmap = np.clip(heatmap, 0, 1)
    heatmap_uint8 = np.uint8(255 * heatmap)

    # Select colormap
    if prediction_label == "PNEUMONIA":
        heatmap_color = cv2.applyColorMap(
            heatmap_uint8, cv2.COLORMAP_HOT
        )   # Red/Orange
        alpha = alpha_pneumonia
    else:
        heatmap_color = cv2.applyColorMap(
            heatmap_uint8, cv2.COLORMAP_SUMMER
        )   # Green/Yellow
        alpha = alpha_healthy

    # 🔴 IMPORTANT: Convert BGR → RGB
    heatmap_color = cv2.cvtColor(heatmap_color, cv2.COLOR_BGR2RGB)

    # Convert original image to array
    img = np.array(img)

    # Overlay
    overlay = cv2.addWeighted(
        img, 1 - alpha,
        heatmap_color, alpha,
        0
    )

    return overlay

def apply_lung_mask(heatmap):
    """
    Suppress Grad-CAM outside approximate lung region.
    """
    h, w = heatmap.shape

    mask = np.zeros((h, w), dtype=np.uint8)

    # Elliptical lung-shaped mask
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

img_path = r""

img_array, raw_img = preprocess_image(img_path)

prob = model.predict(img_array)[0][0]
label = "PNEUMONIA" if prob >= 0.25 else "NORMAL"

heatmap = make_gradcam_heatmap(img_array, model, LAST_CONV_LAYER)
heatmap = apply_lung_mask(heatmap)

overlay = overlay_heatmap_dynamic(
    heatmap,
    raw_img,
    prediction_label=label
)

plt.imshow(overlay)
plt.title(f"{label} | Probability: {prob:.2f}")
plt.axis("off")
plt.show()