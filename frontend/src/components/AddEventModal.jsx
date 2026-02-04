export default function AddEvent({ onClose, onAdd }) {
  const [title, setTitle] = useState("")
  const [date, setDate] = useState("")

  async function handleAdd() {
    const res = await fetch("http://localhost:5000/api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: localStorage.getItem("token")
      },
      body: JSON.stringify({ title, date })
    })

    const data = await res.json()
    onAdd(data)
    onClose()
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60">
      <div className="glass p-6 w-[300px]">
        <h3>Add Event</h3>

        <input
          placeholder="Title"
          className="input my-2"
          onChange={e => setTitle(e.target.value)}
        />
        <input
          type="date"
          className="input my-2"
          onChange={e => setDate(e.target.value)}
        />

        <button onClick={handleAdd} className="btn-primary w-full">
          Add
        </button>
      </div>
    </div>
  )
}
