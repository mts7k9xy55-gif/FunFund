const AIResponseItem = ({ response }) => {
  return (
    <div className="ml-4 mt-2 border-l-2 border-ai-border bg-ai-bg rounded-r-lg pl-3 pr-4 py-3 animate-float-in">
      <div className="flex items-center gap-2 mb-2">
        <div className="text-xs font-medium text-purple-600">AI Assistant</div>
        <div className="h-1 w-1 rounded-full bg-purple-400"></div>
      </div>
      <p className="text-sm text-text-secondary leading-relaxed">{response.content}</p>
    </div>
  );
};

export default AIResponseItem;