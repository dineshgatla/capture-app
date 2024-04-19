import { useRef, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';

// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBvBukrJl4W_82WY4UjLxXZSg3iQYQH72M",
  authDomain: "capture-app-2cd6a.firebaseapp.com",
  projectId: "capture-app-2cd6a",
  storageBucket: "capture-app-2cd6a.appspot.com",
  messagingSenderId: "789657170760",
  appId: "1:789657170760:web:4f6bb31f6e71a98250b97d",
  measurementId: "G-3YC6E2TDEC"
};

const firebaseApp = initializeApp(firebaseConfig);
const storage = getStorage(firebaseApp);

function CameraCapture() {
  const videoRef = useRef();
  const canvasRef = useRef();
  const [capturedImages, setCapturedImages] = useState([]);
// eslint-disable-next-line 
  const [location, setLocation] = useState(null);

  const handleStartCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const handleCaptureImage = async () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataURL = canvas.toDataURL('image/png');
  
    // Upload image to Firebase Storage
    const imageRef = ref(storage, `images/image_${Date.now()}.png`);
    try {
      const uploadTask = uploadString(imageRef, imageDataURL, 'data_url');
  
      uploadTask.on('state_changed', 
        snapshot => {
          // Observe state change events such as progress, pause, and resume
          console.log('Upload is in progress...', snapshot);
        },
        error => {
          // Handle unsuccessful uploads
          console.error('Error uploading image:', error);
          setCapturedImages(prevImages => [...prevImages, { imageDataURL, location: null }]);
        },
        () => {
          // Handle successful uploads on complete
          console.log('Upload successful!');
          getDownloadURL(uploadTask.snapshot.ref).then(downloadURL => {
            console.log('File available at', downloadURL);
            // Get GPS location
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                position => {
                  const { latitude, longitude } = position.coords;
                  setLocation({ latitude, longitude });
                  setCapturedImages(prevImages => [
                    ...prevImages,
                    { imageDataURL, location: { latitude, longitude }, downloadURL }
                  ]);
                },
                error => {
                  console.error('Error getting location:', error);
                  setCapturedImages(prevImages => [...prevImages, { imageDataURL, location: null }]);
                }
              );
            } else {
              console.error('Geolocation is not supported by this browser.');
              setCapturedImages(prevImages => [...prevImages, { imageDataURL, location: null }]);
            }
          }).catch(error => {
            console.error('Error getting download URL:', error);
            setCapturedImages(prevImages => [...prevImages, { imageDataURL, location: null }]);
          });
        }
      );
    } catch (error) {
      console.error('Error uploading image to Firebase Storage:', error);
      setCapturedImages(prevImages => [...prevImages, { imageDataURL, location: null }]);
    }
  };

  

  return (
    <div className='text-center'>
  <div className='text-center'>
        <button onClick={handleStartCapture} style={{ backgroundColor: 'blue', color: 'white', margin: '5px' }}>Start Capture</button>
        <button onClick={handleCaptureImage} style={{ backgroundColor: 'green', color: 'white', margin: '5px' }}>Capture Image</button>
      </div> <video ref={videoRef} width="640" height="480" autoPlay></video>
      {capturedImages.map((image, index) => (
        <div key={index}>
          <h2 className='imagesname'>Image {index + 1}</h2>
          <img src={image.imageDataURL} alt={`Captured ${index + 1}`} />
          
          {image.location && (
            <p>Location: Latitude {image.location.latitude}, Longitude {image.location.longitude}</p>
          )}
          {image.downloadURL && (
            <p>Download URL: <a href={image.downloadURL}>{image.downloadURL}</a></p>
          )}
        </div>
      ))}
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
    </div>
  );
}

export default CameraCapture;
