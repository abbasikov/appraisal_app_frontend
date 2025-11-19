import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  TrashIcon, 
  ChevronUpIcon, 
  ChevronDownIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline';
import Card from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';
import LoadingSpinner from './ui/LoadingSpinner';

const TABLE_CONFIGS = {
  coin: {
    title: 'Coin Collection',
    icon: '🪙',
    columns: [
      { key: 'quantity', label: 'Quantity', type: 'number', required: true, width: 'w-20' },
      { key: 'year', label: 'Year', type: 'text', required: true, width: 'w-24' },
      { key: 'coin_name', label: 'Coin', type: 'text', required: true, width: 'flex-1' },
      { 
        key: 'condition', 
        label: 'Condition', 
        type: 'select', 
        required: true,
        width: 'w-40',
        options: [
          'Poor', 'Fair', 'Good', 'Very Good', 'Fine', 'Very Fine',
          'Extremely Fine', 'About Uncirculated', 'Uncirculated',
          'Brilliant Uncirculated'
        ]
      },
      { key: 'appraised_price', label: 'Appraised Price', type: 'currency', required: true, width: 'w-32' }
    ]
  },
  wine: {
    title: 'Wine Collection',
    icon: '🍷',
    columns: [
      { key: 'quantity', label: 'Quantity', type: 'number', required: true, width: 'w-20' },
      { key: 'bottle_description', label: 'Bottle Description', type: 'text', required: true, wide: true, width: 'flex-1' },
      { key: 'per_bottle_price', label: 'Per Bottle Price', type: 'currency', required: true, width: 'w-32' },
      { key: 'total_price', label: 'Total Price', type: 'currency', required: true, calculated: true, width: 'w-32' }
    ]
  },
  content: {
    title: 'Content Inventory',
    icon: '📦',
    columns: [
      { key: 'area', label: 'Area', type: 'text', required: true, width: 'flex-1' },
      { key: 'fair_market_value', label: 'Fair Market Value (FMV)', type: 'currency', required: true, width: 'w-40' }
    ]
  }
};

const TableDataEntry = ({ templateCategory, items, onItemsChange, projectId, loading }) => {
  const [localItems, setLocalItems] = useState(items || []);
  const [editingCell, setEditingCell] = useState(null);

  useEffect(() => {
    setLocalItems(items || []);
  }, [items]);

  const config = TABLE_CONFIGS[templateCategory];

  if (!config) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">Unsupported template category: {templateCategory}</p>
      </Card>
    );
  }

  const createEmptyItem = () => {
    const newItem = {
      id: null, // Will be assigned by backend
      item_type: templateCategory,
      line_number: localItems.length + 1,
      sort_order: localItems.length + 1,
      attributes: {}
    };

    config.columns.forEach(col => {
      if (col.type === 'number') {
        newItem.attributes[col.key] = 1;
      } else if (col.type === 'currency') {
        newItem.attributes[col.key] = 0;
      } else {
        newItem.attributes[col.key] = '';
      }
    });

    return newItem;
  };

  const handleAddRow = () => {
    const newItem = createEmptyItem();
    const updatedItems = [...localItems, newItem];
    setLocalItems(updatedItems);
    onItemsChange(updatedItems);
  };

  const handleDeleteRow = (index) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      const updatedItems = localItems.filter((_, i) => i !== index);
      // Re-number items
      const renumberedItems = updatedItems.map((item, i) => ({
        ...item,
        line_number: i + 1,
        sort_order: i + 1
      }));
      setLocalItems(renumberedItems);
      onItemsChange(renumberedItems);
    }
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const updatedItems = [...localItems];
    [updatedItems[index - 1], updatedItems[index]] = [updatedItems[index], updatedItems[index - 1]];
    const renumberedItems = updatedItems.map((item, i) => ({
      ...item,
      line_number: i + 1,
      sort_order: i + 1
    }));
    setLocalItems(renumberedItems);
    onItemsChange(renumberedItems);
  };

  const handleMoveDown = (index) => {
    if (index === localItems.length - 1) return;
    const updatedItems = [...localItems];
    [updatedItems[index], updatedItems[index + 1]] = [updatedItems[index + 1], updatedItems[index]];
    const renumberedItems = updatedItems.map((item, i) => ({
      ...item,
      line_number: i + 1,
      sort_order: i + 1
    }));
    setLocalItems(renumberedItems);
    onItemsChange(renumberedItems);
  };

  const handleCellChange = (index, columnKey, value) => {
    const updatedItems = [...localItems];
    updatedItems[index] = {
      ...updatedItems[index],
      attributes: {
        ...updatedItems[index].attributes,
        [columnKey]: value
      }
    };

    // Auto-calculate total_price for wine
    if (templateCategory === 'wine' && (columnKey === 'quantity' || columnKey === 'per_bottle_price')) {
      const quantity = columnKey === 'quantity' ? parseFloat(value) : parseFloat(updatedItems[index].attributes.quantity || 0);
      const perBottle = columnKey === 'per_bottle_price' ? parseFloat(value) : parseFloat(updatedItems[index].attributes.per_bottle_price || 0);
      updatedItems[index].attributes.total_price = quantity * perBottle;
    }

    setLocalItems(updatedItems);
    onItemsChange(updatedItems);
  };

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const calculateTotal = () => {
    if (templateCategory === 'coin') {
      return localItems.reduce((sum, item) => {
        const quantity = parseFloat(item.attributes.quantity || 0);
        const price = parseFloat(item.attributes.appraised_price || 0);
        return sum + (quantity * price);
      }, 0);
    } else if (templateCategory === 'wine') {
      return localItems.reduce((sum, item) => 
        sum + parseFloat(item.attributes.total_price || 0), 0
      );
    } else if (templateCategory === 'content') {
      return localItems.reduce((sum, item) => 
        sum + parseFloat(item.attributes.fair_market_value || 0), 0
      );
    }
    return 0;
  };

  const renderCell = (item, column, index) => {
    const value = item.attributes[column.key] || '';
    const cellKey = `${index}-${column.key}`;
    const isEditing = editingCell === cellKey;
    const isCalculated = column.calculated && templateCategory === 'wine';

    if (column.type === 'select') {
      return (
        <td key={column.key} className={`px-3 py-2 border-b border-gray-200 ${column.width || ''}`}>
          <select
            value={value}
            onChange={(e) => handleCellChange(index, column.key, e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select...</option>
            {column.options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </td>
      );
    }

    if (column.type === 'currency') {
      return (
        <td key={column.key} className={`px-3 py-2 border-b border-gray-200 ${column.width || ''} ${isCalculated ? 'bg-green-50' : ''}`}>
          {isCalculated ? (
            <div className="text-sm font-semibold text-green-700">
              {formatCurrency(value)}
            </div>
          ) : (
            <input
              type="number"
              step="0.01"
              min="0"
              value={value}
              onChange={(e) => handleCellChange(index, column.key, e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="0.00"
            />
          )}
        </td>
      );
    }

    if (column.type === 'number') {
      return (
        <td key={column.key} className={`px-3 py-2 border-b border-gray-200 ${column.width || ''}`}>
          <input
            type="number"
            min="0"
            value={value}
            onChange={(e) => handleCellChange(index, column.key, e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0"
          />
        </td>
      );
    }

    // text type
    return (
      <td key={column.key} className={`px-3 py-2 border-b border-gray-200 ${column.width || ''}`}>
        {column.wide ? (
          <textarea
            value={value}
            onChange={(e) => handleCellChange(index, column.key, e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows="2"
            placeholder={`Enter ${column.label.toLowerCase()}`}
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => handleCellChange(index, column.key, e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={`Enter ${column.label.toLowerCase()}`}
          />
        )}
      </td>
    );
  };

  if (loading) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-500 mt-4">Loading data...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <Card.Header>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{config.icon}</span>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{config.title}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {localItems.length} items • Total value: {formatCurrency(calculateTotal())}
              </p>
            </div>
          </div>
          <Button
            onClick={handleAddRow}
            icon={PlusIcon}
            variant="primary"
          >
            Add Row
          </Button>
        </div>
      </Card.Header>
      
      <div className="w-full overflow-hidden">
        <table className="w-full table-auto">
          <thead className="bg-gradient-to-r from-gray-50 to-blue-50/30 border-b-2 border-blue-200">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-16">
                #
              </th>
              {config.columns.map(column => (
                <th 
                  key={column.key} 
                  className={`px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider ${column.width || ''}`}
                >
                  {column.label}
                  {column.required && <span className="text-red-500 ml-1">*</span>}
                </th>
              ))}
              <th className="px-3 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {localItems.length === 0 ? (
              <tr>
                <td colSpan={config.columns.length + 2} className="px-6 py-12 text-center">
                  <TableCellsIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No items yet. Click "Add Row" to get started.</p>
                </td>
              </tr>
            ) : (
              localItems.map((item, index) => (
                <tr key={index} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-3 py-2 border-b border-gray-200">
                    <Badge variant="gray" size="sm">{index + 1}</Badge>
                  </td>
                  {config.columns.map(column => renderCell(item, column, index))}
                  <td className="px-3 py-2 border-b border-gray-200">
                    <div className="flex items-center justify-end space-x-1">
                      <Button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        variant="ghost"
                        size="sm"
                        icon={ChevronUpIcon}
                        title="Move up"
                      />
                      <Button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === localItems.length - 1}
                        variant="ghost"
                        size="sm"
                        icon={ChevronDownIcon}
                        title="Move down"
                      />
                      <Button
                        onClick={() => handleDeleteRow(index)}
                        variant="ghost"
                        size="sm"
                        icon={TrashIcon}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Delete"
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {localItems.length > 0 && (
            <tfoot className="bg-gradient-to-r from-blue-50 to-green-50 border-t-2 border-blue-200">
              <tr>
                <td colSpan={config.columns.length + 1} className="px-6 py-4 text-right font-bold text-gray-900">
                  Total Appraised Value:
                </td>
                <td className="px-6 py-4 text-right font-bold text-green-700 text-xl">
                  {formatCurrency(calculateTotal())}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </Card>
  );
};

export default TableDataEntry;

