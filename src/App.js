import React, { useState, useRef, useEffect } from 'react';

import './App.css';

// var AES = require("crypto-js")

import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';

import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { confirmPasswordReset } from 'firebase/auth';

const { pki, util, symmetric } = require('node-forge');
const forge = require('node-forge');

// initialization fo the 
firebase.initializeApp({
  apiKey: "AIzaSyDT_C1IIyv5ud4C44P8lKdLIsoWpjVsleY",
  authDomain: "something-5a43f.firebaseapp.com",
  projectId: "something-5a43f",
  storageBucket: "something-5a43f.appspot.com",
  messagingSenderId: "831854510764",
  appId: "1:831854510764:web:b902890727e6eaac4b5509",
  measurementId: "G-8RHCV6BNLY"
})

const auth = firebase.auth();
const firestore = firebase.firestore();


function App() {
  const [user] = useAuthState(auth);
  const [formValue, setFormValue] = useState('');
  

  // Function to generate a random symmetric key
  function generateSymmetricKey() {
    return crypto.randomBytes(32); // 32 bytes = 256 bits
  }
  const storeSymmetricKey = async (key) => {
    try {
      // Create a new document in a "keys" collection with the generated key
      await firestore.collection('keys').doc('symmetricKey').set({
        key: key,
      });
  
      console.log('Symmetric key stored in Firestore successfully');
    } catch (error) {
      console.error('Error storing symmetric key:', error);
    }
  };

  const createChatRoom = async () => {
    // Delete the existing messages collection
    invitedUsers = [];
    const userId = user.uid;
    const messagesRef = firestore.collection('messages');
    const keysRef = firestore.collection('keys');
    await clearCollection(messagesRef);
    await clearCollection(keysRef);

    const username = firestore.collection('users').doc(userId).get('username');

    var idSymmetric = username + 'symmetricKey';

    // the user who created the chatroom (host) will not have the new symmetric key in local storage
    var symmKey = ""
    localStorage.setItem(idSymmetric, symmKey);

    // create new key 

    try{      
      const userId = user.uid; // Assuming the user ID is available from the user object
      
      const userRef = firestore.collection('users').doc(userId);
      console.log("GOT HERE");
      userRef.set({
        //store encrypted symm key?
        host: "Hosting"
    }, {merge: true});
    } catch (error) {
    console.log(error.message);
    }

    // console.log(user);

  };
  const clearCollection = async (collectionRef) => {
    const snapshot = await collectionRef.get();
  
    // Iterate through each document in the collection and delete it
    snapshot.forEach((doc) => {
      doc.ref.delete();
    });
  };

  //invite
  const [username, setUsername] = useState('');
  var [invitedUsers, setInvitedUsers] = useState([]);

  const handleInputChange = (event) => {
    setUsername(event.target.value);
  };
  
  const handleSubmit = () => {
    if (username.trim() !== '') {
      setInvitedUsers((prevUsers) => [...prevUsers, username]);
      setUsername('');
    }
  };
  
  const clearInvitedUsers = () => {
    setInvitedUsers([]);
  };
  
  const checkInvitedUsers = async (invitedUsers) => {
    const userCollection = firebase.firestore().collection('users');
    const userSnapshots = await userCollection.where('username', 'in', invitedUsers).get();
    // gets the symmetric key locally from the host 
    const userId = user.uid;
    const username = firestore.collection('users').doc(userId).get('username');

    var idSymmetric = username + 'symmetricKey';
    const symmetricKey = localStorage.getItem(idSymmetric);
    console.log("Host: ", username, "will encrypt it with the other person's public key");
    console.log(idSymmetric);
  
    const existingUsers = [];
    const nonExistingUsers = [];
  
    console.log("go therefdassfadafsdafdsfads")
    userSnapshots.forEach(async (doc) => {
      existingUsers.push(doc.data().username);
      console.log('fasjdksda');
      var invitee = doc.id;
      // Check if user has a public key  && they have to be online
      // try {
        if (doc.data().publicKey && firestore.collection('keys').doc(doc.id).encSymmetricKey != null) {
          console.log("there is already an encrypted symmetric key for this user...")

        }
        else {
          console.log("This person has already had the key encrypted...");
          const publicKey = doc.data().publicKey;
          // Store the public key in a temporary variable or perform any desired action
          console.log(`User ${doc.data().username} has a public key: ${publicKey}`);


        

          // encrypt symm key using the public key
          
          const buffer = Buffer.from(symmetricKey, 'utf8');
          const encrypted = crypto.publicEncrypt(publicKey, buffer);
          const encryptedSymmetricKey = encrypted.toString('base64');
          console.log(encryptedSymmetricKey);
          // const encryptedSymmetricKeynew = forge.util.decode64(encryptedSymmetricKey);

          clearInvitedUsers();
        }
      
    });
  
    invitedUsers.forEach((user) => {
      if (!existingUsers.includes(user)) {
        nonExistingUsers.push(user);
      }
    });
  
    console.log('Existing Users:', existingUsers);
    console.log('Non-existing Users:', nonExistingUsers);
  };
  
  checkInvitedUsers(invitedUsers)
  .then(() => {
    console.log('Invited users checked successfully');
  })
  .catch((error) => {
    console.error('Error checking invited users:', error);
  });
  
  const decryptSymmetricKey = (encryptedKey, privateKey) => {

    console.log("~~~~~~~~~~~~~~~~~~");

  const decryptionAlgorithm = {
    name: 'RSA-OAEP'
  };

  // Decrypt the encrypted symmetric key using the private key
  window.crypto.subtle.decrypt(decryptionAlgorithm, privateKey, encryptedKey)
  .then((decryptedKey) => {
    // Symmetric key decryption successful
    console.log('Decrypted symmetric key:', decryptedKey);
    return decryptedKey;
  })
  .catch((error) => {
    // Symmetric key decryption failed
    console.error('Error decrypting symmetric key:', error);
  });

};

  const waitForDocument = async (userId) => {
    const userRef = firestore.collection('keys').doc(userId);

    try {
      const doc = await userRef.get();
  
      if (doc.exists) {
        return doc.data();
      } else {
        throw new Error('Document does not exist');
      }
    } catch (error) {
      throw error;
    }
  };
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log(user.uid);
        const userId = user.uid;
        console.log("HELLO I AM HERE NOW KFDSALJFLKSDA ===========");
        const documentData = await waitForDocument(userId);
        console.log("PROMISE HAS BEEN RESOLVED NUMBER 2");
  
        const username = await firestore.collection('users').doc(userId).get().then((doc) => doc.data().username);

        console.log(username);
  
        const idSymmetric = username + 'symmetricKey';
        const encSymmetricKey = documentData.encSymmetricKey;
        const id = username + 'privateKey';
        const privateKey = localStorage.getItem(id);
  
        console.log(privateKey);
        console.log("Going to decrypt");
        console.log(encSymmetricKey);
        //private key is correct, 
        const decryptedSymmetricKey = decryptSymmetricKey(encSymmetricKey, privateKey);
  
        console.log("The session key: ", decryptedSymmetricKey);
  
        localStorage.setItem(idSymmetric, decryptedSymmetricKey);
      } catch (error) {
        console.log("Error occurred during the decryption process:", error);
      }
    };
  
    fetchData();
  }, []);
  

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
            <div className="button-container">
              <button onClick={createChatRoom}>Create Chat Room</button>
            </div>
            <div className="message-container">
              <ChatRoom />
              <div>
                <input
                  type="text"
                  value={username}
                  onChange={handleInputChange}
                  placeholder="Enter username"
                />
                <button onClick={handleSubmit}>Invite</button>
                <h2>Invited Users</h2>
                <ul>
                  {invitedUsers.map((user, index) => (
                    <li key={index}>{user}</li>
                  ))}
                </ul>
                <button onClick={clearInvitedUsers}>Clear Invited Users</button>
              </div>
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

      <div className="online-users-list">
        <p className="list-title">Online Users</p>
        <ul id="onlineUsersList"></ul>
      </div>
    </div>
  );
};


  // const keys = pki.rsa.generateKeyPair({ bits: 2048 });
  // const privateKeyPem = pki.privateKeyToPem(keys.privateKey);
  // const publicKeyPem = pki.publicKeyToPem(keys.publicKey);

  // Generate key pair
  function generateKeyPair() {
    return new Promise((resolve, reject) => {
      try {
        const keyPair = sjcl.ecc.elGamal.generateKeys(256); // Generate 256-bit key pair
        const publicKey = sjcl.codec.base64.fromBits(keyPair.pub.get().x, true);
        const privateKey = sjcl.codec.base64.fromBits(keyPair.sec.get(), true);
        resolve({ publicKey, privateKey });
      } catch (error) {
        reject(error);
      }
    });
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
    
      // Usage example:
      generateKeyPair()
        .then(keyPair => {
          console.log('Public Key:');
          console.log(keyPair.publicKey);
    
          console.log('\nPrivate Key:');
          console.log(keyPair.privateKey);
    
          const userRef = firestore.collection('users').doc(userId);
          console.log("GOT HERE in creating public key for new user...");
          userRef.set({
            status: 'online',
            email: email,
            username: username,
            publicKey: keyPair.publicKey,
            hosting: ""
          }, { merge: true });
    
          var id = username + 'privateKey';
          console.log("saving private key into ID:", id);
          console.log("Private Key: ", keyPair.privateKey);
          localStorage.setItem(id, keyPair.privateKey);
        })
        .catch(error => {
          console.error('Error generating key pair:', error);
        });
    
      setEmail('');
      setPassword('');
    } catch (error) {
      console.error('Error creating user:', error);
    }
  }

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

      try{
        if(userRef.get('publicKey') != null || userRef.get('publicKey') == undefined) {
          console.log("There is a public key");
        }

      } catch(error) {
        // console.log("NO PUBLIC KEY");
        const keyPair = generateKeyPair();
        console.log('Private Key:', keyPair.privateKey);
        console.log('Public Key:', keyPair.publicKey);
  
        console.log("public key: ", keyPair.publicKey);

        userRef.set({
          publicKey:keyPair.publicKey,
          host: ""
        }, {merge: true});

        var id = username + 'privateKey';
        console.log("saving private key into ID: ", id);
        console.log("Private key: ", keyPair.privateKey);
        localStorage.setItem(id, keyPair.privateKey);
      }


  
      console.log("GOT HERE");
      userRef.set({
        status: 'online',
        email: email,
        username: username,
        host: ""
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
        username: username,
        host: ""
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
