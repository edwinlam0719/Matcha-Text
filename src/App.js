import React, { useState, useRef, useEffect } from 'react';

import './App.css';

// var AES = require("crypto-js")

import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';

import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { confirmPasswordReset } from 'firebase/auth';
import { doc } from 'firebase/firestore';

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
    // Simulate a symmetric key
    const symmetricKey = forge.random.getBytesSync(32); // 256-bit key
    console.log('Original Key:', forge.util.bytesToHex(symmetricKey));

    // new added line that would return the created symmetric key
    return symmetricKey;
 
  }

  const createChatRoom = async () => {
    // Delete the existing messages collection
    invitedUsers = [];
    const userId = user.uid;
    const messagesRef = firestore.collection('messages');
    const keysRef = firestore.collection('keys');
    await clearCollection(messagesRef);
    await clearCollection(keysRef);

    const username = firestore.collection('users').doc(userId).get('username');

    //var idSymmetric = username + 'symmetricKey';

    // the user who created the chatroom (host) will not have the new symmetric key in local storage
    //var symmKey = ""
    //localStorage.setItem(idSymmetric, symmKey);
    
    // create new key 
    const symmetricKey = generateSymmetricKey();
    console.log('Original Created after generating new chat room key:', forge.util.bytesToHex(symmetricKey));
    console.log("Storing into 'symmKey");
    localStorage.setItem('symmKey', symmetricKey);


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

    //var idSymmetric = username + 'symmetricKey';
    //const symmetricKey = localStorage.getItem(idSymmetric);
    //console.log("Host: ", username, "will encrypt it with the other person's public key");
    //console.log(idSymmetric);
  
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

          const symmetricKey = localStorage.getItem('symmKey');
          console.log('Original Created after generating new chat room key:', forge.util.bytesToHex(symmetricKey));
          console.log("Storing into 'symmKey");
          
          //console.log("This person has already had the key encrypted...");
          const publicKey = doc.data().publicKey;
          // Store the public key in a temporary variable or perform any desired action
          console.log(`User ${doc.data().username} has a public key: ${publicKey}`);

           // Encrypt the symmetric key using the recipient's public key
          const recipientPublicKey = forge.pki.publicKeyFromPem(publicKey);
          const encryptedSymmetricKey = recipientPublicKey.encrypt(symmetricKey, 'RSA-OAEP', {
            md: forge.md.sha256.create(),
          });
          console.log('Encrypted Symmetric Key:', forge.util.encode64(encryptedSymmetricKey));

          // Store the encrypted symmetric key and public key in Cloud Firestore
          const encryptedSymmetricKeyBase64 = forge.util.encode64(encryptedSymmetricKey);
          const publicKeyPem = forge.pki.publicKeyToPem(recipientPublicKey);
          //need to link the USERID Document to the invited user so they can retrieve and decrypt
          firestore.collection('keys').doc(doc.id).set({
            key: encryptedSymmetricKeyBase64,
            publicKey: publicKeyPem,
          });
         
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


  /**
   * 
   *           //console.log("This person has already had the key encrypted...");
          const publicKey = doc.data().publicKey;
          // Store the public key in a temporary variable or perform any desired action
          console.log(`User ${doc.data().username} has a public key: ${publicKey}`);

           // Encrypt the symmetric key using the recipient's public key
          const recipientPublicKey = forge.pki.publicKeyFromPem(publicKey);
          const encryptedSymmetricKey = recipientPublicKey.encrypt(symmetricKey, 'RSA-OAEP', {
            md: forge.md.sha256.create(),
          });} userId 
   * 
   */

  //var id = username + 'privateKey';
  async function retrieveAndDecryptSymmetricKey(userId) {
    const id = 'privateKey';


  
    const retPrivateKey = await firestore.collection('users').doc(userId).get().then((doc) => doc.data().privateKey);
  
    console.log(retPrivateKey);
  
    console.log("Retrieving from id:", userId);
  
    const encryptedKeyDocRef = firestore.collection('keys').doc(userId);
    try {
      const docSnapshot = await encryptedKeyDocRef.get();
      if (docSnapshot.exists) {
        const encryptedKeyData = docSnapshot.data();
        console.log(encryptedKeyData.key);
        const retrievedEncryptedSymmetricKey = forge.util.decode64(encryptedKeyData.key);
        const privateKey = forge.pki.privateKeyFromPem(retPrivateKey);
        
        console.log("PrivateKey Retrieved:", retPrivateKey);
        console.log("enc symm key",  forge.util.encode64(retrievedEncryptedSymmetricKey));
        console.log("Now decrypting...");
  
        const decryptedSymmetricKey = privateKey.decrypt(retrievedEncryptedSymmetricKey, 'RSA-OAEP', {
          md: forge.md.sha256.create(),
        });
  
        console.log('Decrypted Symmetric Key:', forge.util.bytesToHex(decryptedSymmetricKey));
  
        return decryptedSymmetricKey;
      } else {
        console.log('Encrypted symmetric key document not found.');
        return null;
      }
    } catch (error) {
      console.error('Error retrieving encrypted symmetric key:', error);
      return null;
    }
  }
  
  const [decryptedSymmetricKey, setDecryptedSymmetricKey] = useState('');

  const waitForDocument = async (userId) => {
    return new Promise((resolve, reject) => {
      const userRef = firestore.collection('keys').doc(userId);

      const unsubscribe = userRef.onSnapshot(
        (doc) => {
          if (doc.exists) {
            unsubscribe(); // Unsubscribe to stop listening for further changes
            resolve(doc.data());
          } else {
            reject(new Error('Document does not exist'));
          }
        },
        (error) => {
          reject(error);
        }
      );
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = user.uid;
        const documentData = await waitForDocument(userId);

        const username = await firestore.collection('users').doc(userId).get().then((doc) => doc.data().username);

        const encSymmetricKey = documentData.encSymmetricKey;

        const decryptedSymmetricKey = retrieveAndDecryptSymmetricKey(userId);

        console.log("The session key: ", decryptedSymmetricKey);

        localStorage.setItem("decryptedSymmetricKey", decryptedSymmetricKey);

        setDecryptedSymmetricKey(decryptedSymmetricKey);
      } catch (error) {
        console.log("Error occurred during the decryption process:", error);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 5000); // Call fetchData every 5 seconds

    return () => {
      clearInterval(intervalId); // Clean up the interval on component unmount
    };
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

      // need if statement for the host's symmetric key: symmKey FOR MESSAGE ENCRYPTION
      const decryptedSymmetricKey = localStorage.getItem('decryptedSymmetricKey');

      // convert hte syummetric key to a forge cipher object 
      const cipher = forge.cipher.createCipher('AES-CTR', decryptedSymmetricKey);

      // generate a random IV (initialiation vector)
      const iv = forge.random.getBytesSync(16);

      // set the IV for the cipher
      cipher.start({ iv });

      // convert the message to bytes
      const messageBytes = forge.util.createBuffer(formValue, 'utf8');

      // update the cipher with the message bytes
      cipher.update(messageBytes);
      // finish up
      cipher.finish();

      const encryptedMessage = cipher.output;
      const encryptedMessageBase64 = forge.util.encode64(encryptedMessage.getBytes());
      


      await firestore.collection('messages').add({
        encryptedMessage: encryptedMessageBase64,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        uid: auth.currentUser.uid,
        photoURL: auth.currentUser.photoURL,
        iv: forge.util.encode64(iv)
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
              <button onClick={createChatRoom}>Create</button>
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
                <h2>  [Invited Users]</h2>
                <ul>
                  {invitedUsers.map((user, index) => (
                    <li key={index}>{user}</li>
                  ))}
                </ul>
                
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


// Generate key pair
function generateKeyPair() {
  return new Promise((resolve, reject) => {
    // Generate RSA key pair
    const rsaKeyPair = forge.pki.rsa.generateKeyPair({ bits: 2048 });
    const publicKeyPem = forge.pki.publicKeyToPem(rsaKeyPair.publicKey);
    const privateKeyPem = forge.pki.privateKeyToPem(rsaKeyPair.privateKey);

    resolve({
      publicKey: publicKeyPem,
      privateKey: privateKeyPem
    });
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
          privateKey: keyPair.privateKey,
          host: ""
        }, { merge: true });
    
          var id = username + 'privateKey';
          //fernanbryan28privateKey
          //console.log("saving private key into ID:", id);
          //console.log("Private Key: ", keyPair.privateKey);
          localStorage.setItem('privateKey', keyPair.privateKey);
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
  var {encryptedMessage, uid, photoURL, iv} = props.message;

  /**
   * var {encText,, uid, photoURL, iv} = props.message
   * {
        encryptedMessage: encryptedMessage,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        uid: auth.currentUser.uid,
        photoURL: auth.currentUser.photoURL,
        iv: iv
      }
   * localStorage.setItem('byedecryptedSymmetricKey, key)
     id = uisername + 'decryptedSymmetricKey'
     try{
      symmKey = localStorage.getItem(id)
     } catch (e) {
      console.log("You are not one who has a KEY")
     }
   */

// need if statement for the host's symmetric key: symmKey
//        const username = await firestore.collection('users').doc(userId).get().then((doc) => doc.data().username);
  const status = firestore.collection('users').doc(uid).get('hosting');

  var symmetricKey= "";
  
  if(status === 'hosting') {
    console.log("I AM THE HOST!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    symmetricKey = localStorage.getItem('symmKey');
    console.log(symmetricKey);
  } else {
    console.log("I aint hostee");
    
    symmetricKey = localStorage.getItem('decryptedSymmetricKey');

  }
    // var symmetricKey = localStorage.getItem('decryptedSymmetricKey');

  const encryptedMessageBytes = forge.util.decode64(encryptedMessage);
  
  const ivBytes = forge.util.decode64(iv);

  var decipher = forge.cipher.createDecipher('AES-CTR', symmetricKey);

  decipher.start({iv: ivBytes });
  decipher.update(forge.util.createBuffer(encryptedMessageBytes));
  decipher.finish();

  // get decrypted message...
  var decryptedMessage = decipher.output.toString('utf8');
  console.log('decrypted message', decryptedMessage);

  var text = decryptedMessage;

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
