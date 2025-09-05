// components/InputField.jsx
// Reusable labeled input with optional error message. Controlled via value/onChange.

export default function InputField({ label, name, type = "text", value, onChange, placeholder, error }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`mt-1 w-full px-4 py-2 rounded-lg glass focus:outline-none focus:ring-2 
          ${error ? "border border-red-500 focus:ring-red-500" : "focus:ring-purple-500"}`}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}