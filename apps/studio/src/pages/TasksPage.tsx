import { useCallback, useEffect, useState } from "react";
import { api, type TaskItem, type TaskList } from "../lib/api";
import { Button, TextInput } from "../components/ui";

export function TasksPage() {
  const [lists, setLists] = useState<TaskList[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [items, setItems] = useState<TaskItem[]>([]);
  const [newList, setNewList] = useState("");
  const [newItem, setNewItem] = useState("");

  const loadLists = useCallback(async () => {
    const { lists } = await api.taskLists();
    setLists(lists);
    setActiveId((cur) => cur ?? lists[0]?.id ?? null);
  }, []);
  const loadItems = useCallback(async (listId: string) => {
    setItems((await api.taskItems(listId)).items);
  }, []);

  useEffect(() => {
    void loadLists();
  }, [loadLists]);
  useEffect(() => {
    if (activeId) void loadItems(activeId);
  }, [activeId, loadItems]);

  const addList = async () => {
    if (!newList.trim()) return;
    const l = await api.createTaskList(newList.trim());
    setNewList("");
    await loadLists();
    setActiveId(l.id);
  };
  const addItem = async () => {
    if (!activeId || !newItem.trim()) return;
    await api.addTask(activeId, newItem.trim());
    setNewItem("");
    await loadItems(activeId);
  };
  const toggle = async (it: TaskItem) => {
    await api.updateTask(it.id, { done: !it.done });
    if (activeId) await loadItems(activeId);
  };
  const del = async (it: TaskItem) => {
    await api.deleteTask(it.id);
    if (activeId) await loadItems(activeId);
  };

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-[180px_1fr]">
      <h1 className="sr-only">Tasks</h1>
      <aside className="space-y-3">
        <h2 className="label text-ink-soft">Lists</h2>
        <ul className="space-y-1">
          {lists.map((l) => (
            <li key={l.id}>
              <button
                onClick={() => setActiveId(l.id)}
                className={`w-full rounded-md px-3 py-2 text-left text-sm transition ${
                  l.id === activeId ? "bg-ink text-paper" : "hover:bg-paper-sunk"
                }`}
              >
                {l.name}
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-1">
          <TextInput placeholder="New list" value={newList} onChange={(e) => setNewList(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addList()} />
          <Button variant="ghost" onClick={addList} aria-label="Add list">
            +
          </Button>
        </div>
      </aside>

      <section className="space-y-3">
        {activeId ? (
          <>
            <div className="flex gap-2">
              <TextInput placeholder="Add a task" value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addItem()} />
              <Button variant="accent" onClick={addItem}>
                Add
              </Button>
            </div>
            <ul className="divide-y divide-line rounded-lg border border-line bg-card">
              {items.length === 0 && <li className="px-4 py-3 text-sm text-ink-soft">No tasks yet.</li>}
              {items.map((it) => (
                <li key={it.id} className="flex items-center justify-between px-4 py-2.5">
                  <button
                    onClick={() => toggle(it)}
                    aria-pressed={it.done}
                    aria-label={`Mark "${it.title}" ${it.done ? "not done" : "done"}`}
                    className="flex items-center gap-3 rounded-md text-left"
                  >
                    <span className="font-mono text-sm" aria-hidden="true">{it.done ? "[x]" : "[ ]"}</span>
                    <span className={`text-sm ${it.done ? "text-ink-soft line-through" : ""}`}>{it.title}</span>
                  </button>
                  <button onClick={() => del(it)} aria-label={`Delete "${it.title}"`} className="rounded-md text-xs text-ink-soft hover:text-brick-deep">
                    delete
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-sm text-ink-soft">Create a list to start adding tasks.</p>
        )}
      </section>
    </div>
  );
}
