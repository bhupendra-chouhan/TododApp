import React, { useState, useEffect } from "react";
import { BrowserProvider, Contract } from "ethers";
import TodoListABI from "./TodoList.json";

const Body = () => {
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState("");
  const [todos, setTodos] = useState([]);
  const [newTodoContent, setNewTodoContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");

  const CONTRACT_ADDRESS = "0x1f421F8D9743C32B31218Dc3266CC14A128E23AA";

  // Initialize wallet connection and contract
  useEffect(() => {
    const init = async () => {
      try {
        if (!window.ethereum) {
          throw new Error("Please install MetaMask!");
        }

        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setAccount(accounts[0]);

        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contractInstance = new Contract(
          CONTRACT_ADDRESS,
          TodoListABI,
          signer
        );
        setContract(contractInstance);

        await fetchUserTodos(contractInstance);

        window.ethereum.on("accountsChanged", (accounts) => {
          setAccount(accounts[0]);
        });
      } catch (err) {
        setError(err.message);
        console.error("Initialization failed:", err);
      }
    };

    init();

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners();
      }
    };
  }, []);

  const fetchUserTodos = async (contractInstance) => {
    try {
      setLoading(true);
      const userTodos = await contractInstance.getUserTodos();
      const formattedTodos = userTodos.map((todo) => ({
        id: todo.id.toString(),
        content: todo.content,
        completed: todo.completed,
        creator: todo.creator,
      }));
      setTodos(formattedTodos);
    } catch (error) {
      setError("Failed to fetch todos: " + error.message);
      console.error("Failed to fetch todos", error);
    } finally {
      setLoading(false);
    }
  };

  const createTodo = async () => {
    if (!contract || !newTodoContent.trim()) return;

    try {
      setLoading(true);
      setError("");
      const tx = await contract.createTodo(newTodoContent);
      await tx.wait();
      setNewTodoContent("");
      await fetchUserTodos(contract);
    } catch (error) {
      setError("Failed to create todo: " + error.message);
      console.error("Todo creation failed", error);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (todo) => {
    setEditingId(todo.id);
    setEditContent(todo.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditContent("");
  };

  const updateTodo = async (todoId) => {
    if (!contract || !editContent.trim()) return;

    try {
      setLoading(true);
      setError("");
      const tx = await contract.updateTodo(todoId, editContent);
      await tx.wait();
      setEditingId(null);
      setEditContent("");
      await fetchUserTodos(contract);
    } catch (error) {
      setError("Failed to update todo: " + error.message);
      console.error("Todo update failed", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleComplete = async (todoId) => {
    try {
      setLoading(true);
      setError("");
      const tx = await contract.toggleCompleted(todoId);
      await tx.wait();
      await fetchUserTodos(contract);
    } catch (error) {
      setError("Failed to toggle todo: " + error.message);
      console.error("Toggle completion failed", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTodo = async (todoId) => {
    try {
      setLoading(true);
      setError("");
      const tx = await contract.deleteTodo(todoId);
      await tx.wait();
      await fetchUserTodos(contract);
    } catch (error) {
      setError("Failed to delete todo: " + error.message);
      console.error("Todo deletion failed", error);
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-4">Todo DApp</h1>
          <p className="text-red-500">
            Please connect your wallet to continue.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">Todo DApp</h1>
        <p className="text-sm text-gray-600 mb-4">Connected: {account}</p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="flex mb-4">
          <input
            type="text"
            value={newTodoContent}
            onChange={(e) => setNewTodoContent(e.target.value)}
            placeholder="Enter todo item"
            className="flex-grow border p-2 mr-2"
            disabled={loading}
          />
          <button
            onClick={createTodo}
            className="bg-green-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
            disabled={loading || !newTodoContent.trim()}
          >
            {loading ? "Processing..." : "Add Todo"}
          </button>
        </div>

        <div>
          {loading && <p className="text-center text-gray-600">Loading...</p>}
          {todos.map((todo) => (
            <div
              key={todo.id}
              className="flex items-center justify-between bg-gray-100 p-3 mb-2 rounded"
            >
              {editingId === todo.id ? (
                <div className="flex-grow flex items-center space-x-2">
                  <input
                    type="text"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="flex-grow border p-1 rounded"
                    disabled={loading}
                  />
                  <button
                    onClick={() => updateTodo(todo.id)}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm disabled:bg-gray-400"
                    disabled={loading || !editContent.trim()}
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="bg-gray-500 text-white px-3 py-1 rounded text-sm disabled:bg-gray-400"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <span
                    className={`flex-grow ${
                      todo.completed ? "line-through text-gray-500" : ""
                    }`}
                  >
                    {todo.content}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleComplete(todo.id)}
                      className="text-blue-500 disabled:text-gray-400"
                      disabled={loading}
                    >
                      {todo.completed ? "Undo" : "Complete"}
                    </button>
                    <button
                      onClick={() => startEditing(todo)}
                      className="text-yellow-600 disabled:text-gray-400"
                      disabled={loading}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="text-red-500 disabled:text-gray-400"
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Body;
