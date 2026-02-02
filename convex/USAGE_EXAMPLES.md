# Room-based システム: フロントエンドからの使用例

## 基本的な使い方

### 1. Room作成とアクティブ化

```typescript
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

function CreateRoomButton() {
  const createRoom = useMutation(api.rooms.createRoom);
  const activateRoom = useMutation(api.rooms.activateRoom);

  const handleCreate = async () => {
    try {
      // Room作成（draft状態）
      const roomId = await createRoom({ name: "プロジェクトA" });
      
      // Roomをアクティブ化（ownerのみ）
      await activateRoom({ roomId });
      
      console.log("Room created and activated:", roomId);
    } catch (error) {
      console.error("Failed to create room:", error);
    }
  };

  return <button onClick={handleCreate}>Room作成</button>;
}
```

### 2. Room一覧取得

```typescript
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

function RoomList() {
  const rooms = useQuery(api.rooms.listRoomsForMe) ?? [];

  return (
    <div>
      {rooms.map((room) => (
        <div key={room._id}>
          <h3>{room.name}</h3>
          <p>Status: {room.status}</p>
          <p>My Role: {room.myRole}</p>
        </div>
      ))}
    </div>
  );
}
```

### 3. Thread作成（理由必須チェック）

```typescript
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

function CreateThreadForm({ roomId }: { roomId: Id<"rooms"> }) {
  const createThread = useMutation(api.threads.createThread);
  const [type, setType] = useState<"comment" | "proposal" | "project">("comment");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [reason, setReason] = useState("");

  const handleSubmit = async () => {
    try {
      // proposal/projectの場合は理由必須（サーバー側でチェック）
      await createThread({
        roomId,
        type,
        title: type !== "comment" ? title : undefined,
        initialBody: body,
        reason: (type === "proposal" || type === "project") ? reason : undefined,
      });
      
      // フォームリセット
      setBody("");
      setReason("");
    } catch (error: any) {
      // 理由が空の場合、サーバー側でエラーが返される
      alert(error.message);
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      <select value={type} onChange={(e) => setType(e.target.value as any)}>
        <option value="comment">コメント</option>
        <option value="proposal">提言</option>
        <option value="project">プロジェクト</option>
      </select>
      
      {(type === "proposal" || type === "project") && (
        <input
          type="text"
          placeholder="タイトル"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      )}
      
      <textarea
        placeholder="本文"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      
      {(type === "proposal" || type === "project") && (
        <textarea
          placeholder="理由（必須）"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />
      )}
      
      <button type="submit">作成</button>
    </form>
  );
}
```

### 4. 判断を下す（理由必須）

```typescript
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

function DecisionForm({ roomId, threadId }: { roomId: Id<"rooms">, threadId: Id<"threads"> }) {
  const decide = useMutation(api.decisions.decide);
  const [stance, setStance] = useState<"yes" | "no" | "hold">("yes");
  const [reason, setReason] = useState("");

  const handleSubmit = async () => {
    try {
      // 理由必須（サーバー側でチェック）
      await decide({
        roomId,
        threadId,
        stance,
        reasonBody: reason,
      });
      
      setReason("");
    } catch (error: any) {
      // 理由が空の場合、サーバー側でエラーが返される
      alert(error.message);
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      <select value={stance} onChange={(e) => setStance(e.target.value as any)}>
        <option value="yes">賛成</option>
        <option value="no">反対</option>
        <option value="hold">保留</option>
      </select>
      
      <textarea
        placeholder="理由（必須）"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        required
      />
      
      <button type="submit">判断を下す</button>
    </form>
  );
}
```

### 5. コメント投稿

```typescript
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

function CommentForm({ roomId, threadId }: { roomId: Id<"rooms">, threadId: Id<"threads"> }) {
  const postComment = useMutation(api.messages.postComment);
  const [body, setBody] = useState("");

  const handleSubmit = async () => {
    try {
      // 書き込みガード適用（active room + member/owner）
      await postComment({
        roomId,
        threadId,
        body,
      });
      
      setBody("");
    } catch (error: any) {
      // Roomがactiveでない、またはviewerの場合、サーバー側でエラーが返される
      alert(error.message);
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      <textarea
        placeholder="コメント"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <button type="submit">投稿</button>
    </form>
  );
}
```

### 6. Thread詳細取得

```typescript
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

function ThreadDetail({ threadId }: { threadId: Id<"threads"> }) {
  const threadData = useQuery(api.threads.getThread, { threadId });

  if (!threadData) {
    return <div>Loading...</div>;
  }

  const { thread, messages, decisions, executions } = threadData;

  return (
    <div>
      <h2>{thread.title || `Thread ${thread.type}`}</h2>
      
      {/* メッセージ一覧 */}
      <div>
        <h3>メッセージ</h3>
        {messages.map((msg) => (
          <div key={msg._id}>
            <p>{msg.body}</p>
            <small>{msg.kind}</small>
          </div>
        ))}
      </div>
      
      {/* 判断一覧 */}
      <div>
        <h3>判断</h3>
        {decisions.map((d) => (
          <div key={d._id}>
            <p>Stance: {d.stance}</p>
            <p>Reason: {d.reason}</p>
          </div>
        ))}
      </div>
      
      {/* 実行ログ一覧 */}
      {thread.type === "project" && (
        <div>
          <h3>実行ログ</h3>
          {executions.map((e) => (
            <div key={e._id}>
              <p>Status: {e.status}</p>
              <p>Note: {e.note}</p>
              {e.evidenceUrl && <a href={e.evidenceUrl}>証拠</a>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## エラーハンドリング

すべてのmutationは以下のエラーを返す可能性があります：

- **Unauthorized**: ログインが必要
- **Room is not active**: Roomがactiveでない（書き込み不可）
- **Viewers cannot write**: viewerは書き込み不可
- **Only room owners can perform this action**: ownerのみの操作
- **X requires a reason**: 理由が必須（proposal/project/decision）
- **You are not a member of this room**: Roomのメンバーでない

フロントエンドでは、これらのエラーを適切に処理してください。
