import React, { useState, useRef } from 'react';


import './App.css';

import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';

import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';

firebase.initializeApp({
  apiKey: "AIzaSyDjdfD2b7Q6nBzbQheHVFzgbCtYbwHcAbU",
  authDomain: "matcha-text.firebaseapp.com",
  projectId: "matcha-text",
  storageBucket: "matcha-text.appspot.com",
  messagingSenderId: "630194542456",
  appId: "1:630194542456:web:3be475814533ce04299a8d",
  measurementId: "G-YQQJDP5WEQ"
})

const auth = firebase.auth();
const firestore = firebase.firestore();



function App() {

  const [user] = useAuthState(auth)

  return (
    <div className="Matcha">
      <header>

      </header>

      <section>
        {user ? <ChatRoom/> : <SignIn />}  
      </section>  
    </div>
  );
}

function SignIn() {
  const useSignInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
  }
  // has the user sign in with their Google Account 
  return(
    <button onClick={useSignInWithGoogle}>Sign in with your Google Account</button>
  )
}

// Sign out from the Web App
function SignOut() {
  return auth.currentUser && (
    
    <button onClick={() => auth.SignOut()}>Sign Out</button>

  )
}


// displays the chat room 
function ChatRoom() {
  const messagesRef = firestore.collection('messages');
  const query = messagesRef.orderBy('createdAt').limit(50);

  const [msgs] = useCollectionData(query, { idField: 'id' });
  const [formValue, setFormValue] = useState('');

  const sendMessage = async (e) => {
    e.preventDefault();

    if (formValue.trim() !== '') {
      await messagesRef.add({
        text: formValue,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        uid: auth.currentUser.uid,
        photoURL: auth.currentUser.photoURL
      });

      setFormValue('');
    }
  };

  return (
    <>
      <div>
        {msgs && msgs.map((msg) => <ChatMessage key={msg.id} message={msg} />)}
      </div>

      <form onSubmit={sendMessage}>
        <input
          type="text"
          value={formValue}
          onChange={(e) => setFormValue(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </>
  );
}

function ChatMessage(props) {
  const {text, uid, photoURL } = props.message;

  const messageClass = uid == auth.currentUser.uid ? 'sent': 'received';
  return (
    <div className={`message ${messageClass}`}>

    <img src={photoURL} />
    <p>{text}</p>
  </div>
  )
}

export default App;
