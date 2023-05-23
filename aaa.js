import React, { useState, useRef, useEffect } from 'react';

import './App.css';

// const NodeRSA = require('node-rsa');

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


function App() {
  // Generate RSA key pair
  const rsaKeyPair = forge.pki.rsa.generateKeyPair({ bits: 2048 });
  const publicKeyPem = forge.pki.publicKeyToPem(rsaKeyPair.publicKey);
  const privateKeyPem = forge.pki.privateKeyToPem(rsaKeyPair.privateKey);

  // Store public key into cloud
  const documentRef = firestore.collection('users').doc('wgIkPLHFXkYS7pBAeGr0wauwh3y1'); // Replace 'user1' with the actual user ID
  // Update the document with the public key
  documentRef.update({ publicKey: publicKeyPem })
    .then(() => {
      console.log('Public key stored successfully!');
    })
    .catch((error) => {
      console.error('Error storing public key:', error);
    });
  
    
  // Retrieve public key
  function retrievePublicKey(documentRef) {
    return new Promise((resolve, reject) => {
      documentRef
        .get()
        .then((doc) => {
          if (doc.exists) {
            const retrievedPublicKeyPem = doc.data().publicKey;
            console.log('Public key retrieved:', retrievedPublicKeyPem);
            resolve(retrievedPublicKeyPem); // Resolve the promise with the retrieved public key
          } else {
            console.log('No document found');
            reject(new Error('No document found')); // Reject the promise with an error
          }
        })
        .catch((error) => {
          console.error('Error retrieving document:', error);
          reject(error); // Reject the promise with the error
        });
    });
  }
  
  // Simulate a symmetric key
  const symmetricKey = forge.random.getBytesSync(32); // 256-bit key
  console.log('Original Key:', forge.util.bytesToHex(symmetricKey));


// Retrieve the public key
retrievePublicKey(documentRef)
  .then((retrievedPublicKeyPem) => {
    // Public key retrieved, perform operations with the public key as needed
    console.log('Retrieved public key:', retrievedPublicKeyPem);

    // Encrypt the symmetric key using the recipient's public key
    const recipientPublicKey = forge.pki.publicKeyFromPem(retrievedPublicKeyPem);
    const encryptedSymmetricKey = recipientPublicKey.encrypt(symmetricKey, 'RSA-OAEP', {
      md: forge.md.sha256.create(),
    });
    console.log('Encrypted Symmetric Key:', forge.util.encode64(encryptedSymmetricKey));

    // Store the encrypted symmetric key and public key in Cloud Firestore
    const encryptedSymmetricKeyBase64 = forge.util.encode64(encryptedSymmetricKey);
    const publicKeyPem = forge.pki.publicKeyToPem(rsaKeyPair.publicKey);
    firestore.collection('keys').doc('encryptedSymmetricKey').set({
      key: encryptedSymmetricKeyBase64,
      publicKey: publicKeyPem,
    });
  })
  .catch((error) => {
    console.error('Error retrieving public key:', error);
  });
  console.log("MOVE ON TO STORING AND RETRIEVING THE PRIVATE KEY");
  // Store the private key locally (in a secure manner, e.g., encrypted and password-protected)
  // Make sure to secure the private key properly in your actual implementation
  // console.log("privateKeyPem", privateKeyPem);
  localStorage.setItem('privateKeyPem', privateKeyPem);
  const retPrivateKey = localStorage.getItem('privateKeyPem');
  // console.log("retPrivateKey", retPrivateKey);
  
  // Later, when you want to retrieve and decrypt the symmetric key
  const encryptedKeyDocRef = firestore.collection('keys').doc('encryptedSymmetricKey');
  encryptedKeyDocRef.get().then((docSnapshot) => {
    if (docSnapshot.exists) {
      const encryptedKeyData = docSnapshot.data();
      const retrievedEncryptedSymmetricKey = forge.util.decode64(encryptedKeyData.key);
      const privateKey = forge.pki.privateKeyFromPem(retPrivateKey);
      const decryptedSymmetricKey = privateKey.decrypt(retrievedEncryptedSymmetricKey, 'RSA-OAEP', {
        md: forge.md.sha256.create(),
      });

      // Use the decrypted symmetric key for further encryption/decryption
      console.log('Decrypted Symmetric Key:', forge.util.bytesToHex(decryptedSymmetricKey));

      // decrypt here the line, we already have the decrypted symmetric key, we will now use it to decrypt it the message w the symmetric key
      // Message to encrypt
      const message = 'hello world';
      console.log('Original Message 1:', message);

      // Convert the symmetric key to a Forge cipher object
      const cipher = forge.cipher.createCipher('AES-CTR', decryptedSymmetricKey);

      // Generate a random IV (Initialization Vector)
      const iv = forge.random.getBytesSync(16);

      // Set the IV for the cipher
      cipher.start({ iv });

      // Convert the message to bytes
      const messageBytes = forge.util.createBuffer(message, 'utf8');

      // Update the cipher with the message bytes
      cipher.update(messageBytes);

      // Finalize the encryption
      cipher.finish();

      
      /**
       * 
       * PUBLIC/PRIVATE
       * 
       */


      // Get the encrypted message
     // Get the encrypted message
      const encryptedMessage = cipher.output;



      
      const encryptedMessageBase64 = forge.util.encode64(encryptedMessage.getBytes());

      

      //--------------------------------------------------
      // Send the encrypted message to the "messages" collection
      var docId = "";

      firestore
      .collection('messages')
      .add({ encryptedMessage: encryptedMessageBase64, iv1: forge.util.encode64(iv) })
      .then((docRef) => {
        docId = docRef.id;
        console.log('Encrypted message sent to Firestore:', docRef.id);
        decrypt(docRef.id, decryptedSymmetricKey);
      })
      .catch((error) => {
        console.error('Error sending encrypted message to Firestore:', error);
      });


      //---------------------------------------------------
      //key: bdf462f7533bc569b437cf37f5b1e93c1d119f400cfdc77972b944539a36953c
      //ID OF DOCUMENT: MuetepFUahw9rDXcSHaZ
      // enc.msg Vv1l725H+xBq0V8=
      //forge.util.bytesToHex(decryptedSymmetricKey)
      // console.log(docId);
      // decrypt(docId, decryptedSymmetricKey);








      // Decrypt the encrypted message using the same key and IV
      const decipher = forge.cipher.createDecipher('AES-CTR', decryptedSymmetricKey);
      decipher.start({ iv });
      decipher.update(encryptedMessage);
      decipher.finish();

      // Get the decrypted message
      const decryptedMessage = decipher.output.toString('utf8');

      console.log('Decrypted Message:', decryptedMessage);
     

    } else {
      console.log('Encrypted symmetric key not found.');
    }
  });
  


  return (
    <div>
    </div>
  );
};


//      const encryptedMessageBase64 = forge.util.encode64(encryptedMessage.getBytes());
// key: bdf462f7533bc569b437cf37f5b1e93c1d119f400cfdc77972b944539a36953c
// ID OF DOCUMENT: MuetepFUahw9rDXcSHaZ
// enc.msg Vv1l725H+xBq0V8=

// gets the doc that was just added and also sends the key that was created for that document. 
// maybe try parameters (encMessage, symmetricKey, IV) and this function gets called inside ChatMessage(props)
async function decrypt(docId, symmetricKey) {
  console.log('++++++++++++++++++++++++++++++++++++++++++++++++++++++');

  const messagesRef = firestore.collection('messages').doc(docId);
  console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
  try {
    console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
    const docSnapshot = await messagesRef.get();
    if (docSnapshot.exists) {
      const encryptedMessage = docSnapshot.get('encryptedMessage');
      const iv = docSnapshot.get('iv1');

      console.log("encryptedMessage: ", encryptedMessage);
      console.log("iv: ", iv);

      const encryptedMessageBytes = forge.util.decode64(encryptedMessage);

      console.log('Encrypted Message:', encryptedMessageBytes);

      const ivBytes = forge.util.decode64(iv);
      console.log('IV:', ivBytes);

      // Create a Forge decipher object with the symmetric key and IV
      var decipher = forge.cipher.createDecipher('AES-CTR', symmetricKey);
      decipher.start({ iv: ivBytes });
      decipher.update(forge.util.createBuffer(encryptedMessageBytes));
      decipher.finish();

      // Get the decrypted message
      var decryptedMessage = decipher.output.toString('utf8');
      console.log("#######################################");
      console.log('Decrypted Message:', decryptedMessage);
      console.log("#######################################");

      // Set the current text that will be printed onto the chatlog
      var text = decryptedMessage;
      return text;
    } else {
      console.log('Document not found.');
    }
  } catch (error) {
    console.log('Error retrieving document:', error);
  }
}





export default App;
