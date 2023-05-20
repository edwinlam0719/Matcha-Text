import React, { useState, useRef, useEffect } from 'react';

import './App.css';

import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';

import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';

// initialization fo the 
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
  const [user] = useAuthState(auth);
  const [formValue, setFormValue] = useState('');
  
  useEffect(() => {
    if (user) {
      const userRef = firestore.collection('users').doc(user.uid);
      userRef.set({ status: 'online' }, { merge: true });
    }
  }, [user]);

  useEffect(() => {
    const getUsers = async () => {
      try {
        const usersSnapshot = await firestore.collection('users').get();
        const onlineUsers = [];
  
        usersSnapshot.forEach((doc) => {
          const userData = doc.data();
          if (userData.status === 'online') {
            onlineUsers.push(userData.username);
          }
        });
  
        // Update the online users in the HTML element
        const onlineUsersList = document.getElementById('onlineUsersList');
        onlineUsersList.innerHTML = onlineUsers.map((username) => `<li>${username}</li>`).join('');
      } catch (error) {
        console.log('Error retrieving users:', error);
      }
    };
  
    // Refresh the list every 5 seconds
    const refreshInterval = setInterval(() => {
      getUsers();
    }, 5000);
  
    // Clean up the interval when the component unmounts
    return () => clearInterval(refreshInterval);
  }, []);
  
  
  
  
  

  const handleSignOut = async () => {
    if (user) {
      // Update user status to "offline" in Firestore before signing out
      console.log("Going to sign out...")
      const userRef = firestore.collection('users').doc(user.uid);
      userRef.set({ status: 'offline' }, { merge: true });
    }
    auth.signOut();
  };

  const sendMessage = async (e) => {
    e.preventDefault();

    if (formValue.trim() !== '') {
      await firestore.collection('messages').add({
        text: formValue,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        uid: auth.currentUser.uid,
        photoURL: auth.currentUser.photoURL
      });

      setFormValue('');
    }
  };

  return (
    <div className="Matcha">
      <header className="header">
        <img src="https://media.discordapp.net/attachments/952013756014153733/1109351054002368592/Untitled_Artwork.png?width=70&height=70" style={{ marginLeft: '20px' }} />
        <div className="matcha-header" style={{ fontFamily: 'Arial, sans-serif' }}>Matcha</div>
        {!user && (
          <div>
            <SignIn />
            <SignUp />
          </div>
        )}

        {user && <SignOut handleSignOut={handleSignOut} />}
      </header>

      <section>
        {user ? (
          <div>
            <div className="message-container">
              <ChatRoom />
            </div>

            <form onSubmit={sendMessage}>
              <input
                type="text"
                value={formValue}
                onChange={(e) => setFormValue(e.target.value)}
              />
              <button type="submit">Send</button>
            </form>
          </div>
        ) : (
          <div>
            <SignIn />
          </div>
        )}
      </section>

      <div>
        <ul id="onlineUsersList"></ul>
      </div>

    </div>
  );
}

function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignUp = async (e) => {
    e.preventDefault();

    try {
      const result = await auth.createUserWithEmailAndPassword(email, password);
      const { user } = result;
    
      const str = email.split('@');
      const username = str[0];
      const userId = user.uid; // Get the user ID from the user object
    
      const userRef = firestore.collection('users').doc(userId);
      console.log("GOT HERE");
      userRef.set({
        status: 'online',
        email: email,
        username: username
      }, { merge: true });
    
    } catch (error) {
      console.log(error.message);
    }

    setEmail('');
    setPassword('');
  };

  return (
    <div className="other-element" style={{
      position: 'relative',
    }}>
      <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column' }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          style={{
            backgroundColor: '#1c211b',
            marginBottom: '10px',
            padding: '5px',
            fontSize: '1rem',
          }}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          style={{
            backgroundColor: '#1c211b',
            marginBottom: '10px',
            padding: '5px',
            fontSize: '1rem',
          }}
        />
        <button type="submit"style={{
          color: 'white',
          backgroundColor: '#2F4858',
          border: 'none',
          paddingBottom: '140px',
          textAlign: 'center',
          textDecoration: 'none',
          cursor: 'pointer',
          fontSize: '1rem',
          marginTop: '10px'
        }}
        >
          Register
        </button>
      </form>
    </div>
  );
}

function SignIn() {
  // sign in with Google
  const useSignInWithGoogle = async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
  
    try {
      const result = await auth.signInWithPopup(provider);
      const { user } = result;
  
      const email = user.email;
      const str = email.split('@');
      const username = str[0];
  
      const userId = user.uid; // Assuming the user ID is available from the user object
  
      const userRef = firestore.collection('users').doc(userId);
      console.log("GOT HERE");
      userRef.set({
        status: 'online',
        email: email,
        username: username
      }, {merge: true});

    } catch (error) {
      console.log(error.message);
    }
  };
  

  //sing in with email
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = async (e) => {
    e.preventDefault();
    
    try {
      const result = await auth.signInWithEmailAndPassword(email, password);
      const { user } = result;
    
      const str = email.split('@');
      const username = str[0];
      const userId = user.uid; // Get the user ID from the user object
    
      const userRef = firestore.collection('users').doc(userId);
      console.log("GOT HERE");
      userRef.set({
        status: 'online',
        email: email,
        username: username
      }, { merge: true });
    
    } catch (error) {
      console.log(error.message);
    }
    

    setEmail('');
    setPassword('');
  };

  return (
    <div>
      <form onSubmit={handleSignIn}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <button type="submit"style={{
          color: 'white',
          backgroundColor: '#2F4858',
          border: 'none',
          padding: '10px 20px',
          textAlign: 'center',
          textDecoration: 'none',
          cursor: 'pointer',
          fontSize: '1rem',
          marginTop: '10px'
        }}
        >
          Sign in with Email
        </button>
      </form>

      <button
        onClick={useSignInWithGoogle}
        style={{
          color: 'white',
          backgroundColor: '#2F4858',
          border: 'none',
          padding: '10px 20px',
          textAlign: 'center',
          textDecoration: 'none',
          cursor: 'pointer',
          fontSize: '1rem',
          marginTop: '10px'
        }}
      >
        Sign in with your Google Account
      </button>
    </div>
  );
}

// Sign out from the Web App
function SignOut({ handleSignOut }) {
  return (
    auth.currentUser && (
      <button
        onClick={handleSignOut}
        style={{
          color: 'white',
          backgroundColor: '#2F4858',
          border: 'none',
          padding: '10px 20px',
          textAlign: 'center',
          textDecoration: 'none',
          cursor: 'pointer',
          fontSize: '1rem',
        }}
      >
        Sign Out
      </button>
    )
  );
}

// displays the chat room 
function ChatRoom() {
  const messagesRef = firestore.collection('messages');
  const query = messagesRef.orderBy('createdAt').limit(1000);

  const [msgs] = useCollectionData(query, { idField: 'id' });
  const messageContainerRef = useRef(null);

  const scrollToBottom = () => {
    if (messageContainerRef.current) {
      const { scrollHeight, clientHeight } = messageContainerRef.current;
      messageContainerRef.current.scrollTop = scrollHeight - clientHeight;
    }
  };
  // scrolls to the bottom so that when a new message renders, we can see it. 
  useEffect(() => {
    scrollToBottom();
  }, [msgs]);

  return (
    <div ref={messageContainerRef} className="message-container">
      {msgs && msgs.map((msg) => <ChatMessage key={msg.id} message={msg} />)}
    </div>
  );
}



function ChatMessage(props) {
  var {text, uid, photoURL} = props.message;

  var imgs = ['https://cdn.discordapp.com/attachments/952013756014153733/1109606843501772810/def-profile.jpg',
              'https://cdn.discordapp.com/attachments/952013756014153733/1109607215322640414/Untitled_Artwork.png']

  if (photoURL === null) {
    photoURL = 'https://cdn.discordapp.com/attachments/952013756014153733/1109607215322640414/Untitled_Artwork.png'
  }

  const messageClass = uid === auth.currentUser.uid ? 'sent': 'received';
  //text sent + image
  return (
    <div className={`message ${messageClass}`}>

    <img src={photoURL} style={{ width: '45px', height: '45px', borderRadius: '50%', margin: '2px 5px' }} />


    <p>{text}</p>
  </div>
  )
}

export default App;
