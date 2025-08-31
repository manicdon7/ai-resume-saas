'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  Code,
  Edit3,
  Check,
  X,
  AlertCircle,
  CheckCircle,
  Plus,
  Trash2
} from 'lucide-react';
import { showToast } from '@/lib/toast-config';

const ParsedDataCard = ({
  parsedData = {},
  onUpdate,
  isEditable = false,
  className = ''
}) => {

  const [editingField, setEditingField] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [newArrayItems, setNewArrayItems] = useState({});

  // Field configurations with icons and validation
  const fieldConfigs = {
    name: {
      icon: User,
      label: 'Full Name',
      type: 'text',
      placeholder: 'Enter your full name',
      required: true,
      color: 'text-blue-400'
    },
    email: {
      icon: Mail,
      label: 'Email Address',
      type: 'email',
      placeholder: 'your.email@example.com',
      required: true,
      color: 'text-green-400',
      validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    },
    phone: {
      icon: Phone,
      label: 'Phone Number',
      type: 'tel',
      placeholder: '+1 (555) 123-4567',
      required: false,
      color: 'text-purple-400',
      validate: (value) => /^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/[\s\-\(\)]/g, ''))
    },
    location: {
      icon: MapPin,
      label: 'Location',
      type: 'text',
      placeholder: 'City, State',
      required: false,
      color: 'text-orange-400'
    },
    summary: {
      icon: User,
      label: 'Professional Summary',
      type: 'textarea',
      placeholder: 'Brief professional summary...',
      required: false,
      color: 'text-cyan-400'
    }
  };

  // Array field configurations
  const arrayFieldConfigs = {
    skills: {
      icon: Code,
      label: 'Skills',
      placeholder: 'Add a skill',
      color: 'text-pink-400'
    },
    certifications: {
      icon: Award,
      label: 'Certifications',
      placeholder: 'Add a certification',
      color: 'text-yellow-400'
    }
  };

  // Get confidence score for a field
  const getFieldConfidence = (field, value) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return 0;

    const config = fieldConfigs[field];
    if (config?.validate && !config.validate(value)) return 30;

    // Basic confidence scoring
    if (field === 'email' && value.includes('@')) return 95;
    if (field === 'phone' && value.match(/\d{10,}/)) return 90;
    if (field === 'name' && value.split(' ').length >= 2) return 85;
    if (Array.isArray(value)) return Math.min(value.length * 20, 100);

    return value.length > 0 ? 70 : 0;
  };

  // Handle field editing
  const startEditing = (field) => {
    setEditingField(field);
    setEditValues({
      ...editValues,
      [field]: parsedData[field] || (Array.isArray(parsedData[field]) ? [] : '')
    });
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValues({});
  };

  const saveField = async (field) => {
    if (!onUpdate) return;

    setIsUpdating(true);
    try {
      const newValue = editValues[field];
      await onUpdate({ ...parsedData, [field]: newValue });
      setEditingField(null);
      showToast.success(`${fieldConfigs[field]?.label || field} updated successfully`);
    } catch (error) {
      showToast.error('Failed to update field');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle array field operations
  const addArrayItem = (field, item) => {
    if (!item.trim()) return;

    const currentArray = editValues[field] || parsedData[field] || [];
    const newArray = [...currentArray, item.trim()];
    setEditValues({ ...editValues, [field]: newArray });
  };

  const removeArrayItem = (field, index) => {
    const currentArray = editValues[field] || parsedData[field] || [];
    const newArray = currentArray.filter((_, i) => i !== index);
    setEditValues({ ...editValues, [field]: newArray });
  };

  // Render confidence indicator
  const ConfidenceIndicator = ({ confidence }) => {
    const getColor = () => {
      if (confidence >= 80) return 'text-green-400 bg-green-400/20';
      if (confidence >= 50) return 'text-yellow-400 bg-yellow-400/20';
      if (confidence > 0) return 'text-orange-400 bg-orange-400/20';
      return 'text-red-400 bg-red-400/20';
    };

    const getIcon = () => {
      if (confidence >= 80) return CheckCircle;
      if (confidence > 0) return AlertCircle;
      return X;
    };

    const Icon = getIcon();

    return (
      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getColor()}`}>
        <Icon className="w-3 h-3" />
        {confidence}%
      </div>
    );
  };

  // Render single field
  const renderField = (field, config) => {
    const value = parsedData[field] || '';
    const confidence = getFieldConfidence(field, value);
    const isEditing = editingField === field;
    const editValue = editValues[field] ?? value;

    return (
      <motion.div
        key={field}
        className="p-4 bg-gray-800/30 border border-gray-700 rounded-xl hover:border-gray-600 transition-colors"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <config.icon className={`w-4 h-4 ${config.color}`} />
            <span className="text-sm font-medium text-gray-300">{config.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <ConfidenceIndicator confidence={confidence} />
            {isEditable && !isEditing && (
              <button
                onClick={() => startEditing(field)}
                className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-3">
            {config.type === 'textarea' ? (
              <textarea
                value={editValue}
                onChange={(e) => setEditValues({ ...editValues, [field]: e.target.value })}
                placeholder={config.placeholder}
                className="w-full h-20 bg-gray-900/50 border border-gray-600 rounded-lg p-3 text-gray-300 text-sm resize-none focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
            ) : (
              <input
                type={config.type}
                value={editValue}
                onChange={(e) => setEditValues({ ...editValues, [field]: e.target.value })}
                placeholder={config.placeholder}
                className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-3 text-gray-300 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={cancelEditing}
                className="px-3 py-1 text-gray-400 hover:text-white text-sm transition-colors"
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                onClick={() => saveField(field)}
                disabled={isUpdating || editValue === value}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded transition-colors flex items-center gap-1"
              >
                {isUpdating ? (
                  <motion.div
                    className="w-3 h-3 border border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                ) : (
                  <Check className="w-3 h-3" />
                )}
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="text-white">
            {value ? (
              <p className="text-sm">{value}</p>
            ) : (
              <p className="text-gray-500 text-sm italic">Not provided</p>
            )}
          </div>
        )}
      </motion.div>
    );
  };

  // Render array field
  const renderArrayField = (field, config) => {
    const value = parsedData[field] || [];
    const confidence = getFieldConfidence(field, value);
    const isEditing = editingField === field;
    const editValue = editValues[field] || value;
    const newItem = newArrayItems[field] || '';

    const setNewItem = (value) => {
      setNewArrayItems(prev => ({ ...prev, [field]: value }));
    };

    return (
      <motion.div
        key={field}
        className="p-4 bg-gray-800/30 border border-gray-700 rounded-xl hover:border-gray-600 transition-colors"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <config.icon className={`w-4 h-4 ${config.color}`} />
            <span className="text-sm font-medium text-gray-300">{config.label}</span>
            <span className="text-xs text-gray-500">({value.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <ConfidenceIndicator confidence={confidence} />
            {isEditable && !isEditing && (
              <button
                onClick={() => startEditing(field)}
                className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder={config.placeholder}
                className="flex-1 bg-gray-900/50 border border-gray-600 rounded-lg p-2 text-gray-300 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addArrayItem(field, newItem);
                    setNewItem('');
                  }
                }}
              />
              <button
                onClick={() => {
                  addArrayItem(field, newItem);
                  setNewItem('');
                }}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-32 overflow-y-auto">
              {editValue.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-900/50 rounded-lg">
                  <span className="text-sm text-gray-300">{item}</span>
                  <button
                    onClick={() => removeArrayItem(field, index)}
                    className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={cancelEditing}
                className="px-3 py-1 text-gray-400 hover:text-white text-sm transition-colors"
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                onClick={() => saveField(field)}
                disabled={isUpdating}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded transition-colors flex items-center gap-1"
              >
                {isUpdating ? (
                  <motion.div
                    className="w-3 h-3 border border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                ) : (
                  <Check className="w-3 h-3" />
                )}
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {value.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {value.map((item, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-500/30"
                  >
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm italic">No {field} added</p>
            )}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className={`bg-gray-800/50 border border-gray-700 rounded-2xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Parsed Resume Data</h3>
            <p className="text-sm text-gray-400">
              Extracted information with confidence scores
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(fieldConfigs).map(([field, config]) =>
            renderField(field, config)
          )}
        </div>

        {/* Array Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(arrayFieldConfigs).map(([field, config]) =>
            renderArrayField(field, config)
          )}
        </div>

        {/* Experience and Education sections could be added here */}
        {parsedData.experience && parsedData.experience.length > 0 && (
          <motion.div
            className="p-4 bg-gray-800/30 border border-gray-700 rounded-xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Briefcase className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-gray-300">Experience</span>
              <span className="text-xs text-gray-500">({parsedData.experience.length})</span>
            </div>
            <div className="space-y-2">
              {parsedData.experience.map((exp, index) => (
                <div key={index} className="p-3 bg-gray-900/50 rounded-lg">
                  <p className="text-sm text-white">{exp.title || exp.position || 'Position'}</p>
                  <p className="text-xs text-gray-400">{exp.company || 'Company'} • {exp.duration || 'Duration'}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {parsedData.education && parsedData.education.length > 0 && (
          <motion.div
            className="p-4 bg-gray-800/30 border border-gray-700 rounded-xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-gray-300">Education</span>
              <span className="text-xs text-gray-500">({parsedData.education.length})</span>
            </div>
            <div className="space-y-2">
              {parsedData.education.map((edu, index) => (
                <div key={index} className="p-3 bg-gray-900/50 rounded-lg">
                  <p className="text-sm text-white">{edu.degree || 'Degree'}</p>
                  <p className="text-xs text-gray-400">{edu.school || 'Institution'} • {edu.year || 'Year'}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ParsedDataCard;