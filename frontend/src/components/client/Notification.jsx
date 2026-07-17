import React from 'react';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function Notification({ type, message }) {
  if (!message) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />;
      default:
        return <Info className="w-6 h-6 text-blue-600 flex-shrink-0" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-100 border-2 border-green-300 text-green-800';
      case 'error':
        return 'bg-red-100 border-2 border-red-300 text-red-800';
      default:
        return 'bg-blue-100 border-2 border-blue-300 text-blue-800';
    }
  };

  return (
    <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${getStyles()}`}>
      {getIcon()}
      <p className="font-medium">{message}</p>
    </div>
  );
}