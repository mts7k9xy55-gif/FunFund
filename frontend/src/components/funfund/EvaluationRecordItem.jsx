const EvaluationRecordItem = ({ record }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="pl-4 py-2 ml-2 text-xs text-text-tertiary italic">
      {record.author} が判断を表明しました · {formatTime(record.timestamp)}
    </div>
  );
};

export default EvaluationRecordItem;