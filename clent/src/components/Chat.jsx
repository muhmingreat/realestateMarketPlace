import React, { useEffect, useState, useRef } from "react";
import useKYC from "../hooks/useKycVerifier";

export default function Chat({
  receiverId,
  receiverFullName, // comes from KYC of the other user
  chatMessages = [],
  onNewMessage,
  userObjectId, // ✅ pass current logged-in user's ObjectId into hook
}) {
  const { socket, connected, kycUser } = useKYC(userObjectId); // ✅ get sender info (_id + fullName)
  const [messages, setMessages] = useState(chatMessages || []);
  const [message, setMessage] = useState("");
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Sync props
  useEffect(() => setMessages(chatMessages || []), [chatMessages]);

  // Join room
  useEffect(() => {
    if (!socket || !kycUser?._id || !receiverId) return;

    const room = [kycUser._id, receiverId].sort().join("_");
    socket.emit("joinRoom", room);

    const handleReceive = (msg) => {
      setMessages((prev) => [...prev, msg]);
      onNewMessage?.(msg);
    };

    socket.on("receiveMessage", handleReceive);

    const handleTyping = (userId) => userId === receiverId && setTyping(true);
    const handleStopTyping = (userId) => userId === receiverId && setTyping(false);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);

    return () => {
      socket.off("receiveMessage", handleReceive);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
    };
  }, [socket, kycUser?._id, receiverId, onNewMessage]);

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    if (!socket || !connected || !kycUser?._id) return;
    socket.emit("typing", kycUser._id);
    clearTimeout(window.typingTimeout);
    window.typingTimeout = setTimeout(() => socket.emit("stopTyping", kycUser._id), 1000);
  };

  const sendMessage = () => {
    console.log("🚀 sendMessage called");
    console.log({ message, socket, connected, kycUser });

    if (!message.trim() || !socket || !connected || !kycUser?._id) {
      console.warn("⚠️ Send blocked", { 
        message: message.trim(), 
        socket: !!socket, 
        connected, 
        kycUser 
      });
      return;
    }

    socket.emit("sendMessage", {
      sender: kycUser._id,
      receiver: receiverId,
      message,
    });

    console.log("✅ Message emitted to server:", message);

    // Optimistic UI
    setMessages((prev) => [
      ...prev,
      {
        _id: `tmp_${Date.now()}`,
        sender: { _id: kycUser._id, fullName: kycUser.fullName },
        receiver: { _id: receiverId, fullName: receiverFullName || "" },
        message,
        createdAt: new Date().toISOString(),
      },
    ]);

    setMessage("");
    socket.emit("stopTyping", kycUser._id);
  };

  const myId = String(kycUser?._id);
  useEffect(() => {
  console.log("👤 KYC User updated:", kycUser);
}, [kycUser]);

  return (
    <div className="flex flex-col h-[80vh] w-lg max-w-full mx-auto border border-gray-300 rounded-xl shadow-md bg-gray-50 sm:h-[70vh] md:h-[75vh] lg:h-[80vh]">
      {/* Header */}
      <div className="p-4 flex items-center gap-3 bg-green-500 rounded-t-xl text-white">
        {receiverFullName ? (
          <>
            <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center text-sm font-bold">
              {receiverFullName.slice(0, 2).toUpperCase()}
            </div>
            <h2 className="text-lg text-black font-semibold">{receiverFullName}</h2>
          </>
        ) : (
          <div className="w-10 h-10 rounded-full bg-white" />
        )}
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold">{receiverFullName}</h2>
          {typing && <p className="text-xs opacity-90">Typing...</p>}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-100">
        {messages.map((msg, idx) => {
          const senderObjId = msg.sender?._id || msg.sender;
          const isSender = String(senderObjId) === myId;

          const displayName = isSender
            ? "You"
            : msg.sender?.fullName || receiverFullName || "User";

          return (
            <div key={msg._id || idx} className={`flex ${isSender ? "justify-end" : "justify-start"}`}>
              <div
                className={`relative max-w-[70%] p-3 rounded-2xl break-words ${
                  isSender
                    ? "bg-green-500 text-white rounded-br-none"
                    : "bg-white text-gray-900 rounded-bl-none"
                } shadow-sm`}
              >
                {!isSender && <p className="text-[11px] mb-1 opacity-80">{displayName}</p>}
                <p className="text-sm">{msg.message}</p>
                <div className="flex justify-between items-center mt-1 text-xs opacity-80">
                  <span>
                    {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t flex gap-2 bg-white">
        <input
          type="text"
          value={message}
          onChange={handleInputChange}
          placeholder="Type a message"
          className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring focus:ring-green-300 text-sm"
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          disabled={!message.trim() || !connected  || !kycUser}
          className="bg-green-500 text-white px-4 py-2 rounded-full text-sm hover:bg-green-600 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}



// import React, { useEffect, useState, useRef } from "react";
// import useKYC from "../hooks/useKycVerifier";

// export default function Chat({
//   receiverId,
//   receiverFullName, // comes from KYC of the other user
//   chatMessages = [],
//   onNewMessage,
// }) {
//   const { socket, connected, kycUser } = useKYC(); // ✅ get sender info (_id + fullName)
//   const [messages, setMessages] = useState(chatMessages || []);
//   const [message, setMessage] = useState("");
//   const [typing, setTyping] = useState(false);
//   const messagesEndRef = useRef(null);

//   // Scroll to bottom
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   // Sync props
//   useEffect(() => setMessages(chatMessages || []), [chatMessages]);

//   // Join room
//   useEffect(() => {
//     if (!socket || !kycUser?._id || !receiverId) return;

//     const room = [kycUser._id, receiverId].sort().join("_");
//     socket.emit("joinRoom", room);

//     const handleReceive = (msg) => {
//       setMessages((prev) => [...prev, msg]);
//       onNewMessage?.(msg);
//     };

//     socket.on("receiveMessage", handleReceive);

//     const handleTyping = (userId) => userId === receiverId && setTyping(true);
//     const handleStopTyping = (userId) => userId === receiverId && setTyping(false);
//     socket.on("typing", handleTyping);
//     socket.on("stopTyping", handleStopTyping);

//     return () => {
//       socket.off("receiveMessage", handleReceive);
//       socket.off("typing", handleTyping);
//       socket.off("stopTyping", handleStopTyping);
//     };
//   }, [socket, kycUser?._id, receiverId, onNewMessage]);

//   const handleInputChange = (e) => {
//     setMessage(e.target.value);
//     if (!socket || !connected || !kycUser?._id) return;
//     socket.emit("typing", kycUser._id);
//     clearTimeout(window.typingTimeout);
//     window.typingTimeout = setTimeout(() => socket.emit("stopTyping", kycUser._id), 1000);
//   };

//   // const sendMessage = () => {
//   //   if (!message.trim() || !socket || !connected || !kycUser?._id) return;

//   //   socket.emit("sendMessage", {
//   //     sender: kycUser._id, // ✅ use ObjectId
//   //     receiver: receiverId,
//   //     message,
//   //   });

//   //   // Optimistic UI
//   //   setMessages((prev) => [
//   //     ...prev,
//   //     {
//   //       _id: `tmp_${Date.now()}`,
//   //       sender: { _id: kycUser._id, fullName: kycUser.fullName },
//   //       receiver: { _id: receiverId, fullName: receiverFullName || "" },
//   //       message,
//   //       createdAt: new Date().toISOString(),
//   //     },
//   //   ]);

//   //   setMessage("");
//   //   socket.emit("stopTyping", kycUser._id);
//   // };
//   const sendMessage = () => {
//   console.log("🚀 sendMessage called");
//   console.log({ message, socket, connected, kycUser });

//   if (!message.trim() || !socket || !connected || !kycUser?._id) {
//     console.warn("⚠️ Send blocked", { 
//       message: message.trim(), 
//       socket: !!socket, 
//       connected, 
//       kycUser 
//     });
//     return;
//   }

//   socket.emit("sendMessage", {
//     sender: kycUser._id,
//     receiver: receiverId,
//     message,
//   });

//   console.log("✅ Message emitted to server:", message);

//   // Optimistic UI
//   setMessages((prev) => [
//     ...prev,
//     {
//       _id: `tmp_${Date.now()}`,
//       sender: { _id: kycUser._id, fullName: kycUser.fullName },
//       receiver: { _id: receiverId, fullName: receiverFullName || "" },
//       message,
//       createdAt: new Date().toISOString(),
//     },
//   ]);

//   setMessage("");
//   socket.emit("stopTyping", kycUser._id);
// };


//   const myId = String(kycUser?._id);

//   return (
//     <div className="flex flex-col h-[80vh] w-lg max-w-full mx-auto border border-gray-300 rounded-xl shadow-md bg-gray-50 sm:h-[70vh] md:h-[75vh] lg:h-[80vh]">
//       {/* Header */}
//       <div className="p-4 flex items-center gap-3 bg-green-500 rounded-t-xl text-white">
//         {receiverFullName ? (
//           <>
//             <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center text-sm font-bold">
//               {receiverFullName.slice(0, 2).toUpperCase()}
//             </div>
//             <h2 className="text-lg text-black font-semibold">{receiverFullName}</h2>
//           </>
//         ) : (
//           <div className="w-10 h-10 rounded-full bg-white" />
//         )}
//         <div className="flex flex-col">
//           <h2 className="text-lg font-semibold">{receiverFullName}</h2>
//           {typing && <p className="text-xs opacity-90">Typing...</p>}
//         </div>
//       </div>

//       {/* Messages */}
//       <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-100">
//         {messages.map((msg, idx) => {
//           const senderObjId = msg.sender?._id || msg.sender;
//           const isSender = String(senderObjId) === myId;

//           const displayName = isSender
//             ? "You"
//             : msg.sender?.fullName || receiverFullName || "User";

//           return (
//             <div key={msg._id || idx} className={`flex ${isSender ? "justify-end" : "justify-start"}`}>
//               <div
//                 className={`relative max-w-[70%] p-3 rounded-2xl break-words ${
//                   isSender
//                     ? "bg-green-500 text-white rounded-br-none"
//                     : "bg-white text-gray-900 rounded-bl-none"
//                 } shadow-sm`}
//               >
//                 {!isSender && <p className="text-[11px] mb-1 opacity-80">{displayName}</p>}
//                 <p className="text-sm">{msg.message}</p>
//                 <div className="flex justify-between items-center mt-1 text-xs opacity-80">
//                   <span>
//                     {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {
//                       hour: "2-digit",
//                       minute: "2-digit",
//                     })}
//                   </span>
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//         <div ref={messagesEndRef} />
//       </div>

//       {/* Input */}
//       <div className="p-3 border-t flex gap-2 bg-white">
//         <input
//           type="text"
//           value={message}
//           onChange={handleInputChange}
//           placeholder="Type a message"
//           className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring focus:ring-green-300 text-sm"
//           onKeyDown={(e) => e.key === "Enter" && sendMessage()}
//         />
//         <button
//           onClick={sendMessage}
//           disabled={!message.trim() || !connected}
//           className="bg-green-500 text-white px-4 py-2 rounded-full text-sm hover:bg-green-600 disabled:opacity-50"
//         >
//           Send
//         </button>
//       </div>
//     </div>
//   );
// }



// import React, { useEffect, useState, useRef } from "react";
// import useKYC from "../hooks/useKycVerifier";

// // NOTE: senderId and receiverId MUST be MongoDB ObjectId strings.
// // You can still pass receiverFullName if you already have it,
// // but the server will also populate names on each received message.
// export default function Chat({
//   senderId,
//   receiverId,
//   receiverFullName, // optional convenience prop
//   chatMessages = [],
//   onNewMessage,
// }) {
//   const { socket, connected } = useKYC();
//   const [messages, setMessages] = useState(chatMessages || []);
//   const [message, setMessage] = useState("");
//   const [typing, setTyping] = useState(false);
//   const messagesEndRef = useRef(null);

//   // Scroll to bottom
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   // Keep local state in sync with prop
//   useEffect(() => setMessages(chatMessages || []), [chatMessages]);

//   // Join the chat room for this pair (sorted)
//   useEffect(() => {
//     if (!socket || !senderId || !receiverId) return;
//     const room = [senderId, receiverId].sort().join("_");
//     socket.emit("joinRoom", room);

//     const handleReceive = (msg) => {
//       setMessages((prev) => [...prev, msg]);
//       onNewMessage?.(msg);
//       // NOTE: if you want "seen" mechanics, emit here
//       // socket.emit("messageSeen", { room, msgId: msg._id, seenBy: senderId });
//     };

//     socket.on("receiveMessage", handleReceive);

//     // OPTIONAL: implement typing events on server to enable these
//     const handleTyping = (userId) => userId === receiverId && setTyping(true);
//     const handleStopTyping = (userId) => userId === receiverId && setTyping(false);
//     socket.on("typing", handleTyping);
//     socket.on("stopTyping", handleStopTyping);

//     return () => {
//       socket.off("receiveMessage", handleReceive);
//       socket.off("typing", handleTyping);
//       socket.off("stopTyping", handleStopTyping);
//     };
//   }, [socket, senderId, receiverId, onNewMessage]);

//   const handleInputChange = (e) => {
//     setMessage(e.target.value);
//     if (!socket || !connected) return;
//     socket.emit("typing", senderId);
//     clearTimeout(window.typingTimeout);
//     window.typingTimeout = setTimeout(() => socket.emit("stopTyping", senderId), 1000);
//   };

//   const sendMessage = () => {
//     if (!message.trim() || !socket || !connected) return;

//     // Server will validate ids, compute room, save, populate names, and broadcast
//     socket.emit("sendMessage", {
//       sender: senderId,
//       receiver: receiverId,
//       message,
//     });

//     // Optimistic UI (shape similar to server payload)
//     setMessages((prev) => [
//       ...prev,
//       {
//         _id: `tmp_${Date.now()}`,
//         sender: { _id: senderId, fullName: "You" },
//         receiver: { _id: receiverId, fullName: receiverFullName || "" },
//         message,
//         createdAt: new Date().toISOString(),
//       },
//     ]);

//     onNewMessage?.({
//       sender: { _id: senderId },
//       receiver: { _id: receiverId },
//       message,
//     });

//     setMessage("");
//     socket.emit("stopTyping", senderId);
//   };

//   const myId = String(senderId);

//   return (
//     <div className="flex flex-col h-[80vh] w-lg max-w-full mx-auto border border-gray-300 rounded-xl shadow-md bg-gray-50 sm:h-[70vh] md:h-[75vh] lg:h-[80vh]">
//       {/* Header */}
//       <div className="p-4 flex items-center gap-3 bg-green-500 rounded-t-xl text-white">
//         {receiverFullName ? (
//           <>
//             <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center text-sm font-bold">
//               {receiverFullName.slice(0, 2).toUpperCase()}
//             </div>
//             <h2 className="text-lg text-black font-semibold">{receiverFullName}</h2>
//           </>
//         ) : (
//           <div className="w-10 h-10 rounded-full bg-white" />
//         )}
//         <div className="flex flex-col">
//           <h2 className="text-lg font-semibold">{receiverFullName}</h2>
//           {typing && <p className="text-xs opacity-90">Typing...</p>}
//         </div>
//       </div>

//       {/* Messages */}
//       <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-100">
//         {messages.map((msg, idx) => {
//           const senderObjId =
//             (msg.sender && (msg.sender._id || msg.sender)) || msg.senderId || "";
//           const isSender = String(senderObjId) === myId;

//           const displayName = isSender
//             ? "You"
//             : msg.sender?.fullName || msg.senderFullName || receiverFullName || "User";

//           return (
//             <div key={msg._id || idx} className={`flex ${isSender ? "justify-end" : "justify-start"}`}>
//               <div
//                 className={`relative max-w-[70%] p-3 rounded-2xl break-words ${
//                   isSender
//                     ? "bg-green-500 text-white rounded-br-none"
//                     : "bg-white text-gray-900 rounded-bl-none"
//                 } shadow-sm`}
//               >
//                 {!isSender && (
//                   <p className="text-[11px] mb-1 opacity-80">{displayName}</p>
//                 )}
//                 <p className="text-sm">{msg.message}</p>
//                 <div className="flex justify-between items-center mt-1 text-xs opacity-80">
//                   <span>
//                     {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {
//                       hour: "2-digit",
//                       minute: "2-digit",
//                     })}
//                   </span>
//                   {/* If you add "read" later */}
//                   {/* {isSender && <span className="ml-2">{msg.read ? "✓✓" : "✓"}</span>} */}
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//         <div ref={messagesEndRef} />
//       </div>

//       {/* Input */}
//       <div className="p-3 border-t flex gap-2 bg-white">
//         <input
//           type="text"
//           value={message}
//           onChange={handleInputChange}
//           placeholder="Type a message"
//           className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring focus:ring-green-300 text-sm"
//           onKeyDown={(e) => e.key === "Enter" && sendMessage()}
//         />
//         <button
//           onClick={sendMessage}
//           disabled={!message.trim() || !connected}
//           className="bg-green-500 text-white px-4 py-2 rounded-full text-sm hover:bg-green-600 disabled:opacity-50"
//         >
//           Send
//         </button>
//       </div>
//     </div>
//   );
// }




// // import React, { useEffect, useState, useRef } from "react";
// // import useKYC from "../hooks/useKycVerifier";

// // export default function Chat({ senderId, receiverId, senderFullName, 
// //   receiverFullName, chatMessages = [], onNewMessage }) {
    
// //   const { socket, connected } = useKYC();
// //   const [messages, setMessages] = useState(chatMessages || []);
// //   const [message, setMessage] = useState("");
// //   const [typing, setTyping] = useState(false);
// //   const messagesEndRef = useRef(null);

// //   // Scroll to bottom automatically
// //   const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
// //   useEffect(scrollToBottom, [messages]);

// //   // Sync props
// //   useEffect(() => setMessages(chatMessages), [chatMessages]);

// //   // Socket listeners
// //   useEffect(() => {
// //     if (!socket || !senderId || !receiverId) return;

// //     const room = [senderId, receiverId].sort().join("_");
// //     socket.emit("joinRoom", room);

// //     const handleReceive = (msg) => {
// //       setMessages((prev) => [...prev, { ...msg, seen: false }]);
// //       if (onNewMessage) onNewMessage(msg);
// //       if (msg.sender === receiverId) socket.emit("messageSeen", msg.room, senderId);
// //     };

// //     const handleTyping = (userId) => userId === receiverId && setTyping(true);
// //     const handleStopTyping = (userId) => userId === receiverId && setTyping(false);

// //     const handleSeen = (msgId) => {
// //       setMessages((prev) => prev.map((m) => (m._id === msgId ? { ...m, seen: true } : m)));
// //     };

// //     socket.on("receiveMessage", handleReceive);
// //     socket.on("typing", handleTyping);
// //     socket.on("stopTyping", handleStopTyping);
// //     socket.on("messageSeen", handleSeen);

// //     return () => {
// //       socket.off("receiveMessage", handleReceive);
// //       socket.off("typing", handleTyping);
// //       socket.off("stopTyping", handleStopTyping);
// //       socket.off("messageSeen", handleSeen);
// //     };
// //   }, [socket, senderId, receiverId]);

// //   const handleInputChange = (e) => {
// //     setMessage(e.target.value);
// //     if (!socket || !connected) return;

// //     socket.emit("typing", senderId);
// //     clearTimeout(window.typingTimeout);
// //     window.typingTimeout = setTimeout(() => socket.emit("stopTyping", senderId), 1000);
// //   };

// //   const sendMessage = () => {
// //     if (!message.trim() || !socket || !connected) return;

// //     // const msgData = {
// //     //   sender: senderId,
// //     //   receiver: receiverId,
// //     //   message,
// //     //   timestamp: new Date().toISOString(),
// //     //   room: [senderId, receiverId].sort().join("_"),
// //     //   seen: false,
// //     //   senderFullName,
// //     //   receiverFullName,
// //     // };
// //     const msgData = {
// //   sender: senderId,          // <-- should be the ObjectId from MongoDB
// //   receiver: receiverId,      // <-- ObjectId
// //   message,
// //   //  timestamp: new Date().toISOString(),
// //   room: [senderId, receiverId].sort().join("_"),
// // };
// // socket.emit("sendMessage", msgData);

// // console.log(senderFullName,
// //       receiverFullName)
// //     socket.emit("sendMessage", msgData);
// //     setMessages((prev) => [...prev, msgData]);
// //     if (onNewMessage) onNewMessage(msgData);
// //     setMessage("");
// //     socket.emit("stopTyping", senderId);
// //   };

// //   return (
// //     <div className="flex flex-col h-[80vh]  w-lg max-w-full mx-auto border border-gray-300 rounded-xl 
// //     shadow-md bg-gray-50 sm:h-[70vh] md:h-[75vh] lg:h-[80vh]">
// //       {/* Header */}
// //       <div className="p-4 flex items-center gap-3 bg-green-500 rounded-t-xl text-white">



// //           {receiverFullName ? (
// //   <>
// //     <div className="w-10 h-10 rounded-full bg-green-700 flex 
// //     items-center justify-center text-sm font-bold">
// //       {receiverFullName.slice(0, 2).toUpperCase()}
// //     </div>
// //     <h2 className="text-lg text-black font-semibold">{receiverFullName}</h2>
// //   </>
// // ) : (
// //   <div className="w-10 h-10 rounded-full bg-white" />
// // )}

// // <div className="flex flex-col">
// //   <h2 className="text-lg font-semibold">{receiverFullName}</h2>
// //   {typing && <p className="text-xs opacity-90">Typing...</p>}
// // </div>


// //         <div className="flex flex-col">
// //           <h2 className="text-lg font-semibold">{receiverFullName}</h2>
// //           {typing && <p className="text-xs opacity-90">Typing...</p>}
// //         </div>
// //       </div>

// //       {/* Messages */}
// //       <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-100">
// //         {messages.map((msg, idx) => {
        
// //           const isSender = msg.sender._id === senderId;

// //           return (
// //             <div key={idx} className={`flex ${isSender ? "justify-end" : "justify-start"}`}>
// //               <div
// //                 className={`relative max-w-[70%] p-3 rounded-2xl break-words ${
// //                   isSender
// //                     ? "bg-green-500 text-white rounded-br-none"
// //                     : "bg-white text-gray-900 rounded-bl-none"
// //                 } shadow-sm`}
// //               >
// //                 <p className="text-sm">{msg.message}</p>
// //                 <div className="flex justify-between items-center mt-1 text-xs text-gray-900">
// //                   <span>
// //                     {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], {
// //                       hour: "2-digit",
// //                       minute: "2-digit",
// //                     })}
// //                   </span>
// //                   {isSender && <span className="ml-2">{msg.seen ? "✓✓" : "✓"}</span>}
// //                 </div>
// //               </div>
// //             </div>
// //           );
// //         })}
// //         <div ref={messagesEndRef} />
// //       </div>

// //       {/* Input */}
// //       <div className="p-3 border-t flex gap-2 bg-white">
// //         <input
// //           type="text"
// //           value={message}
// //           onChange={handleInputChange}
// //           placeholder="Type a message"
// //           className="flex-1 border rounded-full px-4 py-2 focus:outline-none 
// //           focus:ring focus:ring-green-300 text-sm"
// //           onKeyDown={(e) => e.key === "Enter" && sendMessage()}
// //         />
// //         <button
// //           onClick={sendMessage}
// //           disabled={!message.trim() || !connected}
// //           className="bg-green-500 text-white px-4 py-2 rounded-full
// //            text-sm hover:bg-green-600 disabled:opacity-50"
// //         >
// //           Send
// //         </button>
// //       </div>
// //     </div>
// //   );
// // }

