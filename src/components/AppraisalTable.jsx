import React, { useState } from 'react';
import { 
  ChevronUpIcon, 
  ChevronDownIcon,
  PhotoIcon,
  TrashIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';

const AppraisalTable = ({ items, onItemUpdate, onItemsReorder, loading }) => {
  const [draggedItem, setDraggedItem] = useState(null);
  const [editingCell, setEditingCell] = useState(null);

  const handleDragStart = (e, item, index) => {
    setDraggedItem({ item, index });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.index === targetIndex) {
      setDraggedItem(null);
      return;
    }

    const newItems = [...items];
    const [movedItem] = newItems.splice(draggedItem.index, 1);
    newItems.splice(targetIndex, 0, movedItem);

    // Update line numbers
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      line_number: index + 1,
      sort_order: index + 1
    }));

    onItemsReorder(updatedItems);
    setDraggedItem(null);
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    
    const updatedItems = newItems.map((item, idx) => ({
      ...item,
      line_number: idx + 1,
      sort_order: idx + 1
    }));

    onItemsReorder(updatedItems);
  };

  const handleMoveDown = (index) => {
    if (index === items.length - 1) return;
    
    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    
    const updatedItems = newItems.map((item, idx) => ({
      ...item,
      line_number: idx + 1,
      sort_order: idx + 1
    }));

    onItemsReorder(updatedItems);
  };

  const handleCellEdit = (itemId, field, value) => {
    onItemUpdate(itemId, { [field]: value });
    setEditingCell(null);
  };

  const handleCellClick = (itemId, field) => {
    setEditingCell(`${itemId}-${field}`);
  };

  const formatCurrency = (value) => {
    if (!value) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-12 text-center">
        <PhotoIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No appraisal items found</p>
        <p className="text-sm text-gray-400 mt-2">
          Click "Initialize from Photos" to create items from project photos
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
              #
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
              Photo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Room/Area
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Description
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
              Value ($)
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((item, index) => (
            <tr
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, item, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className="hover:bg-gray-50 cursor-move"
            >
              {/* Line Number */}
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                <div className="flex items-center space-x-2">
                  <Bars3Icon className="h-4 w-4 text-gray-400" />
                  <span>{item.line_number}</span>
                </div>
              </td>

              {/* Photo Thumbnail */}
              <td className="px-6 py-4 whitespace-nowrap">
                {item.photo_thumbnail ? (
                  <img
                    src={`/api/v1/photos/thumbnail/${item.photo_id}`}
                    alt={item.photo_filename}
                    className="h-12 w-12 object-cover rounded cursor-pointer hover:opacity-75"
                    onClick={() => {/* TODO: Implement click-to-enlarge */}}
                  />
                ) : (
                  <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
                    <PhotoIcon className="h-6 w-6 text-gray-400" />
                  </div>
                )}
              </td>

              {/* Room/Area */}
              <td className="px-6 py-4 whitespace-nowrap">
                {editingCell === `${item.id}-room_area` ? (
                  <input
                    type="text"
                    defaultValue={item.room_area || ''}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    onBlur={(e) => handleCellEdit(item.id, 'room_area', e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleCellEdit(item.id, 'room_area', e.target.value);
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <div
                    className="text-sm text-gray-900 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                    onClick={() => handleCellClick(item.id, 'room_area')}
                  >
                    {item.room_area || 'Click to edit'}
                  </div>
                )}
              </td>

              {/* Type */}
              <td className="px-6 py-4 whitespace-nowrap">
                {editingCell === `${item.id}-item_type` ? (
                  <select
                    defaultValue={item.item_type || ''}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    onBlur={(e) => handleCellEdit(item.id, 'item_type', e.target.value)}
                    onChange={(e) => handleCellEdit(item.id, 'item_type', e.target.value)}
                    autoFocus
                  >
                    <option value="">Select Type</option>
                    <option value="art">Art</option>
                    <option value="jewelry">Jewelry</option>
                    <option value="furniture">Furniture</option>
                    <option value="collectibles">Collectibles</option>
                    <option value="electronics">Electronics</option>
                    <option value="other">Other</option>
                  </select>
                ) : (
                  <div
                    className="text-sm text-gray-900 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                    onClick={() => handleCellClick(item.id, 'item_type')}
                  >
                    {item.item_type || 'Click to select'}
                  </div>
                )}
              </td>

              {/* Description */}
              <td className="px-6 py-4">
                {editingCell === `${item.id}-description` ? (
                  <textarea
                    defaultValue={item.description || ''}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm resize-none"
                    rows="2"
                    onBlur={(e) => handleCellEdit(item.id, 'description', e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleCellEdit(item.id, 'description', e.target.value);
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <div
                    className="text-sm text-gray-900 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded max-w-xs"
                    onClick={() => handleCellClick(item.id, 'description')}
                  >
                    {item.description || 'Click to edit'}
                  </div>
                )}
              </td>

              {/* Value */}
              <td className="px-6 py-4 whitespace-nowrap">
                {editingCell === `${item.id}-appraised_value` ? (
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={item.appraised_value || ''}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    onBlur={(e) => handleCellEdit(item.id, 'appraised_value', parseFloat(e.target.value) || 0)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleCellEdit(item.id, 'appraised_value', parseFloat(e.target.value) || 0);
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <div
                    className="text-sm text-gray-900 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded font-medium"
                    onClick={() => handleCellClick(item.id, 'appraised_value')}
                  >
                    {formatCurrency(item.appraised_value)}
                  </div>
                )}
              </td>

              {/* Actions */}
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    title="Move up"
                  >
                    <ChevronUpIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === items.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    title="Move down"
                  >
                    <ChevronDownIcon className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Summary Row */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">
            Total Items: {items.length}
          </span>
          <span className="text-lg font-bold text-gray-900">
            Total Value: {formatCurrency(items.reduce((sum, item) => sum + (item.appraised_value || 0), 0))}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AppraisalTable;