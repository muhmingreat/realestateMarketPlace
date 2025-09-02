import Chat from "../components/Chat";
import { useSelector, useDispatch } from "react-redux";
import { addChartPoint } from "../redux/slices/realEstateSlice";

export default function ChatPage({ currentUserId, targetUserId }) {
  const dispatch = useDispatch();
  const chatMessages = useSelector((state) => state.realEstate.chartData || []);

  if (!currentUserId) return <p>Loading...</p>;

  const handleNewMessage = (msg) => {
    dispatch(addChartPoint(msg));
  };

  return (
    <Chat
      senderId={currentUserId}
      receiverId={targetUserId}
      chatMessages={chatMessages}
      onNewMessage={handleNewMessage}
    />
  );
}
