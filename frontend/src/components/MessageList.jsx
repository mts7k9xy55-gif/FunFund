import Message from "./Message";

const MessageList = ({ messages, onConvertToProject }) => {
  if (!messages || messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>No messages yet. Start the conversation!</p>
      </div>
    );
  }

  return (
    <div className="py-4">
      {messages.map((message) => (
        <Message 
          key={message.id} 
          message={message} 
          onConvertToProject={onConvertToProject}
        />
      ))}
    </div>
  );
};

export default MessageList;
