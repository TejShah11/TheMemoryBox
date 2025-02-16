import os
import uuid
import hashlib
import pandas as pd
import numpy as np
import cv2
import face_recognition
from PIL import Image
import moviepy.editor as mp
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
from moviepy.editor import ImageClip, concatenate_videoclips
from moviepy.audio.io.AudioFileClip import AudioFileClip
from moviepy import video as vfx
import uuid
from datetime import datetime
from moviepy.video.VideoClip import ImageClip
from moviepy.video.fx import fadein, fadeout, resize, crop
from moviepy.video.fx.all import rotate
from moviepy.video.compositing.CompositeVideoClip import CompositeVideoClip
import traceback


app = Flask(__name__)
CORS(app)

# Constants
CSV_FILE = "face_database.csv"
MAX_DIMENSION = 900
DISTANCE_THRESHOLD = 0.45
MAX_IMAGE_SIZE_KB = 1024
IMAGE_DIR = "grouped_faces"
VIDEO_OUTPUT_DIR = "memory_videos"
BACKGROUND_MUSIC_DIR = "background_music"
DEFAULT_MUSIC_TRACK = "Inspire.mp3"

# Ensure necessary directories exist
os.makedirs(IMAGE_DIR, exist_ok=True)
os.makedirs(VIDEO_OUTPUT_DIR, exist_ok=True)
os.makedirs(BACKGROUND_MUSIC_DIR, exist_ok=True)

def get_image_hash(image):
    """Generate a unique hash for an image"""
    img_array = np.array(image)
    return hashlib.md5(img_array.tobytes()).hexdigest()

def preprocess_image(image):
    """Convert image to appropriate color space"""
    img_cv = np.array(image.convert('RGB'))
    img_cv = cv2.cvtColor(img_cv, cv2.COLOR_RGB2BGR)
    img_cv = cv2.cvtColor(img_cv, cv2.COLOR_BGR2RGB)
    return Image.fromarray(img_cv)

def resize_image(image):
    """Resize image if it exceeds maximum dimension"""
    width, height = image.size
    if max(width, height) > MAX_DIMENSION:
        scaling_factor = MAX_DIMENSION / max(width, height)
        new_size = (int(width * scaling_factor), int(height * scaling_factor))
        image = image.resize(new_size, Image.LANCZOS)
    return image

def get_face_embeddings(image):
    """Detect face locations and generate face embeddings"""
    image_np = np.array(image)
    face_locations = face_recognition.face_locations(image_np, model="default")
    face_encodings = face_recognition.face_encodings(image_np, face_locations)
    return face_locations, face_encodings

def compute_group_id(face_embedding, existing_embeddings, group_map):
    """Compute group ID based on face similarity"""
    if not existing_embeddings:
        return f"Group_{len(group_map) + 1}"

    distances = face_recognition.face_distance(existing_embeddings, face_embedding)
    min_distance = np.min(distances)
    if min_distance < DISTANCE_THRESHOLD:
        return group_map[np.argmin(distances)]

    return f"Group_{len(group_map) + 1}"

def save_group_images(image, face_location, group_id, image_id):
    """Save both full image and face image in group folder"""
    group_path = os.path.join(IMAGE_DIR, group_id)
    os.makedirs(group_path, exist_ok=True)
    
    # Save full image
    image.save(os.path.join(group_path, f"{image_id}_full.jpg"))

@app.route('/upload', methods=['POST'])
def upload_image():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    
    # Validate file size
    file.seek(0, os.SEEK_END)
    file_size_kb = file.tell() / 1024
    file.seek(0)
    
    if file_size_kb > MAX_IMAGE_SIZE_KB:
        return jsonify({"error": f"File size exceeds {MAX_IMAGE_SIZE_KB} KB"}), 400

    try:
        image = Image.open(file)
        processed_image = preprocess_image(image)
        image_hash = get_image_hash(processed_image)
        
        # Check if image already exists
        if os.path.exists(CSV_FILE):
            database = pd.read_csv(CSV_FILE)
            if 'Image Hash' in database.columns and image_hash in database['Image Hash'].values:
                return jsonify({"error": "Image already uploaded"}), 400
        
        resized_image = resize_image(processed_image)
        face_locations, face_encodings = get_face_embeddings(resized_image)

        if not face_encodings:
            return jsonify({"error": "No faces detected"}), 400

        if os.path.exists(CSV_FILE):
            database = pd.read_csv(CSV_FILE)
            if 'Face Embedding' in database.columns:
                database["Face Embedding"] = database["Face Embedding"].apply(eval)
        else:
            database = pd.DataFrame(columns=["Face ID", "Group ID", "Face Embedding", "Image Hash", "Image ID"])

        existing_embeddings = database["Face Embedding"].tolist() if "Face Embedding" in database.columns else []
        group_map = database["Group ID"].tolist() if "Group ID" in database.columns else []

        image_id = str(uuid.uuid4())
        
        for face_location, encoding in zip(face_locations, face_encodings):
            group_id = compute_group_id(encoding, existing_embeddings, group_map)
            face_id = f"Face_{len(database) + 1}"

            save_group_images(resized_image, face_location, group_id, image_id)

            new_entry = {
                "Face ID": face_id,
                "Group ID": group_id,
                "Face Embedding": encoding.tolist(),
                "Image Hash": image_hash,
                "Image ID": image_id
            }

            database = pd.concat([database, pd.DataFrame([new_entry])], ignore_index=True)

        database.to_csv(CSV_FILE, index=False)
        return jsonify({"message": "Faces processed successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/groups', methods=['GET'])
def get_groups():
    if not os.path.exists(CSV_FILE):
        return jsonify({"error": "No groups found"}), 404
    
    database = pd.read_csv(CSV_FILE)
    group_images = {}
    
    for group_id, group_data in database.groupby("Group ID"):
        group_images[group_id] = []
        for _, row in group_data.iterrows():
            image_path = os.path.join(IMAGE_DIR, group_id, f"{row['Image ID']}_full.jpg")
            if os.path.exists(image_path):
                group_images[group_id].append(image_path)
    
    return jsonify(group_images), 200

VIDEO_WIDTH = 1920
VIDEO_HEIGHT = 1080

def create_cross_fade_video(image_paths, output_path):
    """Create video with cross-fade transitions"""
    clips = []
    fade_in_duration = 1
    fade_out_duration = 1
    hold_duration = 2

    for i, image_path in enumerate(image_paths):
        total_duration = hold_duration + fade_in_duration + fade_out_duration
        
        clip = ImageClip(image_path, duration=total_duration)
        clip = clip.resize(height=VIDEO_HEIGHT, width=VIDEO_WIDTH)
        
        if i > 0:
            clip = clip.set_start(clips[i-1].start + fade_out_duration / 2)
        
        clip = clip.fadein(fade_in_duration).fadeout(fade_out_duration)
        
        clips.append(clip)

    video_clip = concatenate_videoclips(clips, method="compose", padding=-1, bg_color=(0, 0, 0))
    return video_clip

def apply_common_transformations(image_path, duration=4):
    """
    Base method to load and prepare images consistently across animations
    Ensures images are:
    - Resized to fit video dimensions while maintaining aspect ratio
    - Centered in the frame
    """
    clip = ImageClip(image_path, duration=duration)
    
    # Resize to fit video height while maintaining aspect ratio
    clip = clip.resize(height=VIDEO_HEIGHT)
    
    # Center the image horizontally and vertically
    clip = clip.set_position('center')
    
    return clip

# def slide_left_to_right(image_paths, output_path):
#     """Slides images from left to right, creating a smooth transition."""
#     clips = []
#     duration = 3  # Duration each image is fully visible
#     transition_duration = 1  # Duration of the slide transition

#     for i, image_path in enumerate(image_paths):
#         clip = ImageClip(image_path).resize(height=VIDEO_HEIGHT).set_duration(duration)
#         clip = clip.set_position(("center", "center"))
#         clips.append(clip)
#         if i < len(image_paths) -1:
#             # Create a transition clip
#             next_clip = ImageClip(image_paths[i+1]).resize(height=VIDEO_HEIGHT).set_duration(transition_duration)
#             next_clip = next_clip.set_position(lambda t: (VIDEO_WIDTH - (t) * VIDEO_WIDTH / transition_duration))
#             clips.append(next_clip)


#     final_clip = concatenate_videoclips(clips)
#     final_clip.write_videofile(output_path, fps=24)
#     return final_clip

def zoom_in_out(image_paths, output_path):
    """
    Zoom in and out effect for all images
    Maintains centered positioning
    """
    clips = []
    duration_per_image = 4
    
    for image_path in image_paths:
        clip = apply_common_transformations(image_path, duration_per_image)
        
        # Smooth zoom effect
        clip = clip.resize(
            lambda t: 1 + 0.3 * np.sin(2 * np.pi * t / duration_per_image)
        )
        
        clips.append(clip)
    
    return concatenate_videoclips(clips, method="compose")

def spiral_rotation(image_paths, output_path):
    """
    Spiral rotation effect for all images
    Maintains centered positioning
    """
    clips = []
    duration_per_image = 4
    
    for image_path in image_paths:
        clip = apply_common_transformations(image_path, duration_per_image)
        
        # Spiral rotation with zoom
        clip = clip.rotate(
            lambda t: 360 * t / duration_per_image
        ).resize(
            lambda t: 1 + 0.3 * t / duration_per_image
        )
        
        clips.append(clip)
    
    return concatenate_videoclips(clips, method="compose")

def ken_burns_effect(image_paths, output_path):
    """
    Ken Burns style panning and zooming
    Maintains centered positioning
    """
    clips = []
    duration_per_image = 4
    
    for image_path in image_paths:
        clip = apply_common_transformations(image_path, duration_per_image)
        
        # Pan and zoom effect
        clip = clip.resize(
            lambda t: 1.2 + 0.3 * t / duration_per_image
        ).set_position(
            lambda t: (
                int(-100 * t / duration_per_image), 
                int(-50 * t / duration_per_image)
            )
        )
        
        clips.append(clip)
    
    return concatenate_videoclips(clips, method="compose")

# def morph_effect(image_paths, output_path):
#     """
#     Optimized morph distortion effect for all images
#     """
#     clips = []
#     duration_per_image = 4

#     def apply_morph_frame(img1, img2, t):
#         # Linear interpolation between images
#         alpha = np.clip(t, 0, 1)  # Ensure alpha is within [0, 1]
#         morphed_img = (1 - alpha) * img1 + alpha * img2
#         return morphed_img.astype(np.uint8)

#     for i in range(len(image_paths) - 1):
#         img1 = cv2.imread(image_paths[i])
#         img2 = cv2.imread(image_paths[i + 1])

#         # Resize images to match dimensions (if necessary)
#         img1 = cv2.resize(img1, (VIDEO_WIDTH, VIDEO_HEIGHT))
#         img2 = cv2.resize(img2, (VIDEO_WIDTH, VIDEO_HEIGHT))

#         # Create clip with morph effect
#         clip = ImageClip(image_paths[i], duration=duration_per_image)
#         clip = clip.resize(height=VIDEO_HEIGHT)
#         clip = clip.set_make_frame(lambda t: apply_morph_frame(img1, img2, t))

#         clips.append(clip)

#     return concatenate_videoclips(clips, method="compose") 


@app.route('/create-video', methods=['POST'])
def create_memory_video():
    """
    Create a memory video for a specific group with selected animation.
    
    Workflow:
    1. Validate input parameters
    2. Check if video already exists to avoid redundant processing
    3. Retrieve group images from database
    4. Select and apply animation effect
    5. Add background music
    6. Write final video file
    """
    group_id = request.json.get('group_id')
    animation_type = request.json.get('animation_type', 'cross_fade')
    
    try:
        # Validate group ID is provided
        if not group_id:
            return jsonify({"error": "Group ID is required"}), 400
        
        # Generate unique output path for the video
        output_path = os.path.join(
            VIDEO_OUTPUT_DIR, 
            f"{group_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}_memory.mp4"
        )
        
        # Reuse existing video if it exists
        if os.path.exists(output_path):
            return jsonify({"video_path": output_path}), 200
        
        # Read the database to get group images
        database = pd.read_csv(CSV_FILE)
        group_images = database[database['Group ID'] == group_id]
        
        # Collect image paths
        image_paths = []
        for _, row in group_images.iterrows():
            image_path = os.path.join(IMAGE_DIR, group_id, f"{row['Image ID']}_full.jpg")
            if os.path.exists(image_path):
                image_paths.append(image_path)
        
        # Validate image paths
        if not image_paths:
            return jsonify({"error": f"No images found for group {group_id}"}), 404
        
        # Animation function mapping
        animation_functions = {
            'cross_fade': create_cross_fade_video,
            # 'slide_left_right': slide_left_to_right,
            'zoom': zoom_in_out,
            'spiral': spiral_rotation,
            'ken_burns': ken_burns_effect,
            # 'morph': morph_effect
        }
        
        # Select animation function (default to cross_fade if not found)
        create_video_func = animation_functions.get(animation_type, create_cross_fade_video)
        
        # Create video clip with selected animation
        video_clip = create_video_func(image_paths, output_path)
        
        # Add background music
        music_path = os.path.join(BACKGROUND_MUSIC_DIR, DEFAULT_MUSIC_TRACK)
        
        if os.path.exists(music_path):
            audio_clip = AudioFileClip(music_path)
            
            # Adjust audio duration
            if audio_clip.duration > video_clip.duration:
                audio_clip = audio_clip.subclip(0, video_clip.duration)
            else:
                # Loop audio if shorter than video
                audio_clip = audio_clip.fx(vfx.fx.loop, duration=video_clip.duration)
            
            final_clip = video_clip.set_audio(audio_clip)
        else:
            final_clip = video_clip
        
        # Write video file
        final_clip.write_videofile(
            output_path, 
            fps=24,  # Standard video frame rate
            codec='libx264',  # Widely compatible video codec
            audio_codec='aac'  # Widely compatible audio codec
        )
        
        return jsonify({"video_path": output_path}), 200
    
    except Exception as e:
        # Comprehensive error handling
        return jsonify({
            "error": str(e),
            "details": traceback.format_exc()  # Optional: include full traceback for debugging
        }), 500

# Helper animation functions (as defined in previous artifact)
# Include all the animation functions: create_cross_fade_video, 
# slide_left_to_right, zoom_in_out, etc.

from flask import send_from_directory

@app.route('/grouped_faces/<path:filename>', methods=['GET'])
def serve_grouped_faces(filename):
    return send_from_directory(IMAGE_DIR, filename)

@app.route('/memory-videos', methods=['GET'])
def list_memory_videos():
    try:
        video_files = [f for f in os.listdir(VIDEO_OUTPUT_DIR) if f.endswith('_memory.mp4')]
        return jsonify(video_files)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/memory_videos/<path:filename>', methods=['GET'])
def serve_memory_videos(filename):
    return send_from_directory(VIDEO_OUTPUT_DIR, filename)

if __name__ == '__main__':
    app.run(debug=True, port=5000)