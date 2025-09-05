// components/Button.jsx
// Reusable button with default styles. Pass text, type, and onClick handler.

export default function Button({ text, onClick, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="px-6 py-2 rounded-lg glass bg-purple-600 text-white hover:bg-purple-700 transition"
    >
      {text}
    </button>
  );
}