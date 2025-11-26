import React, { useState, useEffect } from "react";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  PhotoIcon,
  TrashIcon,
  Bars3Icon,
  MagnifyingGlassIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import Card from "./ui/Card";
import Button from "./ui/Button";
import Badge from "./ui/Badge";
import LoadingSpinner from "./ui/LoadingSpinner";
import Modal from "./ui/Modal";
import api from "../services/api";
import { appraisalService } from "../services/appraisalService";

const AppraisalTable = ({ items, onItemUpdate, onItemsReorder, loading, project, detectedItemType }) => {
  const [draggedItem, setDraggedItem] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [schema, setSchema] = useState(null);
  const [expandedAttributes, setExpandedAttributes] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [useTemplateMode, setUseTemplateMode] = useState(true); // Default to template mode

  // Load saved items per page preference from localStorage
  useEffect(() => {
    try {
      const savedItemsPerPage = localStorage.getItem('appraisalTableItemsPerPage');
      if (savedItemsPerPage) {
        const value = parseInt(savedItemsPerPage, 10);
        if ([10, 25, 50, 100].includes(value)) {
          setItemsPerPage(value);
        }
      }
    } catch (error) {
      console.warn("Could not load items per page preference:", error);
    }
  }, []);

  useEffect(() => {
    const fetchSchema = async () => {
      try {
        const schemaData = await appraisalService.getAppraisalSchema();
        setSchema(schemaData);
      } catch (error) {
        console.error("Failed to load appraisal schema:", error);
      }
    };
    fetchSchema();
  }, []);

  const handleDragStart = (e, item, index) => {
    setDraggedItem({ item, index });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
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
      sort_order: index + 1,
    }));

    onItemsReorder(updatedItems);
    setDraggedItem(null);
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;

    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [
      newItems[index],
      newItems[index - 1],
    ];

    const updatedItems = newItems.map((item, idx) => ({
      ...item,
      line_number: idx + 1,
      sort_order: idx + 1,
    }));

    onItemsReorder(updatedItems);
  };

  const handleMoveDown = (index) => {
    if (index === items.length - 1) return;

    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [
      newItems[index + 1],
      newItems[index],
    ];

    const updatedItems = newItems.map((item, idx) => ({
      ...item,
      line_number: idx + 1,
      sort_order: idx + 1,
    }));

    onItemsReorder(updatedItems);
  };

  // Helper function to parse description and extract quantity and price
  const parseDescriptionForValue = (description, itemType) => {
    if (!description) return 0;
    
    const isCoin = itemType?.toLowerCase() === 'coins' || itemType?.toLowerCase() === 'coin';
    const isWine = itemType?.toLowerCase() === 'wine' || itemType?.toLowerCase() === 'wines';
    
    if (!isCoin && !isWine) return null; // Only for Coin/Wine templates
    
    try {
      // Parse Coins template: "Quantity: X" and "Value Per Coin $: Y"
      if (isCoin) {
        const quantityMatch = description.match(/Quantity:\s*(\d+(?:\.\d+)?)/i);
        const priceMatch = description.match(/Value Per Coin \$:\s*(\d+(?:\.\d+)?)/i);
        
        if (quantityMatch && priceMatch) {
          const quantity = parseFloat(quantityMatch[1]) || 0;
          const pricePerCoin = parseFloat(priceMatch[1]) || 0;
          return quantity * pricePerCoin;
        }
      }
      
      // Parse Wine template: "Quantity: X" and "Per Bottle Price: Y"
      if (isWine) {
        const quantityMatch = description.match(/Quantity:\s*(\d+(?:\.\d+)?)/i);
        const priceMatch = description.match(/Per Bottle Price:\s*(\d+(?:\.\d+)?)/i);
        
        if (quantityMatch && priceMatch) {
          const quantity = parseFloat(quantityMatch[1]) || 0;
          const pricePerBottle = parseFloat(priceMatch[1]) || 0;
          return quantity * pricePerBottle;
        }
      }
    } catch (error) {
      console.error('Error parsing description for value:', error);
    }
    
    return null;
  };

  const handleCellEdit = (itemId, field, value) => {
    if (field.startsWith("attr_")) {
      const attrName = field.replace("attr_", "");
      const item = items.find((i) => i.id === itemId);
      const newAttributes = { ...item.attributes, [attrName]: value };
      onItemUpdate(itemId, { attributes: newAttributes });
    } else {
      // Handle description change with auto-calculation
      if (field === "description") {
        const item = items.find((i) => i.id === itemId);
        const calculatedValue = parseDescriptionForValue(value, item?.item_type || detectedItemType);
        
        if (calculatedValue !== null) {
          // Auto-calculate value for Coin/Wine
          onItemUpdate(itemId, { 
            [field]: value,
            appraised_value: calculatedValue
          });
        } else {
          onItemUpdate(itemId, { [field]: value });
        }
      }
      // Handle item type change with template auto-population
      else if (
        field === "item_type" &&
        useTemplateMode &&
        schema?.description_templates
      ) {
        const template = schema.description_templates[value];
        if (template) {
          // Auto-populate description with template
          onItemUpdate(itemId, {
            [field]: value,
            description: template,
          });
        } else {
          onItemUpdate(itemId, { [field]: value });
        }
      } else if (field === "appraised_value") {
        const numericValue = value === "" || value === null ? null : Number(value);
        onItemUpdate(itemId, { appraised_value: isNaN(numericValue) ? null : numericValue });
      } else {
        onItemUpdate(itemId, { [field]: value });
      }
    }
    setEditingCell(null);
  };

  const toggleAttributeExpansion = (itemId) => {
    setExpandedAttributes((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const renderAttributeColumns = (item) => {
    if (!schema || !item.item_type || !schema.type_attributes[item.item_type]) {
      return null;
    }

    const attributes = schema.type_attributes[item.item_type];
    const isExpanded = expandedAttributes[item.id];

    if (!isExpanded) {
      return (
        <td className="table-cell">
          <Button
            onClick={() => toggleAttributeExpansion(item.id)}
            variant="ghost"
            size="sm"
            icon={PlusIcon}
            className="text-blue-600 hover:text-blue-800"
          >
            {attributes.length} attributes
          </Button>
        </td>
      );
    }

    return attributes.map((attr) => (
      <td key={attr} className="table-cell">
        {editingCell === `${item.id}-attr_${attr}` ? (
          <input
            type="text"
            defaultValue={item.attributes?.[attr] || ""}
            className="form-input text-sm"
            onBlur={(e) =>
              handleCellEdit(item.id, `attr_${attr}`, e.target.value)
            }
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleCellEdit(item.id, `attr_${attr}`, e.target.value);
              }
            }}
            autoFocus
          />
        ) : (
          <div
            className="text-sm text-gray-900 cursor-pointer hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-blue-200"
            onClick={() => handleCellClick(item.id, `attr_${attr}`)}
          >
            {item.attributes?.[attr] || (
              <span className="text-gray-400 italic">Click to edit</span>
            )}
          </div>
        )}
      </td>
    ));
  };

  const handleCellClick = (itemId, field) => {
    setEditingCell(`${itemId}-${field}`);
  };

  const formatCurrency = (value) => {
    if (!value) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const handlePhotoClick = (item) => {
    setSelectedPhoto(item);
    setPhotoModalOpen(true);
  };

  const ThumbnailImage = ({ projectId, photoId, alt, className }) => {
    const [imageSrc, setImageSrc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
      const fetchThumbnail = async () => {
        try {
          setLoading(true);
          const response = await api.get(
            `/projects/${projectId}/photos/${photoId}/thumbnail`,
            {
              responseType: "blob",
            }
          );
          const imageUrl = URL.createObjectURL(response.data);
          setImageSrc(imageUrl);
          setError(false);
        } catch (err) {
          // Silently handle 404 errors (deleted photos)
          if (err.response && err.response.status === 404) {
            console.log(`Photo ${photoId} not found (may have been deleted)`);
          } else {
            console.error("Error loading thumbnail:", err);
          }
          setError(true);
        } finally {
          setLoading(false);
        }
      };

      if (projectId && photoId) {
        fetchThumbnail();
      } else {
        setLoading(false);
        setError(true);
      }

      return () => {
        if (imageSrc) {
          URL.revokeObjectURL(imageSrc);
        }
      };
    }, [projectId, photoId]);

    if (loading) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 animate-pulse">
          <span className="text-xs text-gray-400">Loading...</span>
        </div>
      );
    }

    if (error || !imageSrc) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-200">
          <PhotoIcon className="h-6 w-6 text-gray-400" />
        </div>
      );
    }

    return (
      <img
        src={imageSrc}
        alt={alt}
        className={className}
        onError={() => setError(true)}
      />
    );
  };

  if (loading) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-500 mt-4">Loading appraisal items...</p>
        </div>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="p-12 text-center">
        <PhotoIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No appraisal items found
        </h3>
        <p className="text-gray-500 mb-6">
          Click "Initialize from Photos" to create items from project photos
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-sm text-blue-700">
            💡 <strong>Tip:</strong> Upload photos to your project first, then
            initialize appraisal items to get started quickly.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell w-16">#</th>
                <th className="table-header-cell w-20">Photo</th>
                {/* Hide Room/Area and Floor/Bldg for Coins and Wine */}
                {detectedItemType !== "Coins" && detectedItemType !== "Wine" && (
                  <>
                    <th className="table-header-cell">Room/Area</th>
                    <th className="table-header-cell">Floor/Bldg</th>
                  </>
                )}
                <th className="table-header-cell text-center">
                  <div className="flex items-center justify-center">
                    <span>Type</span>
                    {/* Template/Multi-field toggle temporarily commented out */}
                    {/* <Button
                      onClick={() => setUseTemplateMode(!useTemplateMode)}
                      variant="ghost"
                      size="sm"
                      className="text-xs px-2 py-1 rounded-md border border-gray-200 hover:bg-gray-50"
                      title={
                        useTemplateMode
                          ? "Switch to legacy multi-field mode"
                          : "Switch to template mode"
                      }
                    >
                      {useTemplateMode ? "📝 Template" : "📋 Multi-field"}
                    </Button> */}
                  </div>
                </th>
                <th className="table-header-cell">
                  {useTemplateMode ? "Description (Template)" : "Description"}
                </th>
                <th className="table-header-cell w-32">Value ($)</th>
                {/* Dynamic attribute headers - only show in multi-field mode */}
                {!useTemplateMode &&
                  items.some(
                    (item) =>
                      expandedAttributes[item.id] &&
                      item.item_type &&
                      schema?.type_attributes[item.item_type]
                  ) &&
                  schema?.type_attributes[
                    items.find((item) => expandedAttributes[item.id])?.item_type
                  ]?.map((attr) => (
                    <th key={attr} className="table-header-cell text-xs">
                      {attr.replace("_", " ")}
                    </th>
                  ))}
                {!useTemplateMode &&
                  !items.some((item) => expandedAttributes[item.id]) && (
                    <th className="table-header-cell">Attributes</th>
                  )}
                <th className="table-header-cell w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {items
                .slice(
                  (currentPage - 1) * itemsPerPage,
                  currentPage * itemsPerPage
                )
                .map((item, index) => {
                  const actualIndex = (currentPage - 1) * itemsPerPage + index;
                  return (
                    <tr
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item, actualIndex)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, actualIndex)}
                      className="table-row cursor-move group"
                    >
                      {/* Line Number */}
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          <Bars3Icon className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                          <Badge variant="gray" size="sm">
                            {item.line_number}
                          </Badge>
                        </div>
                      </td>

                      {/* Photo Thumbnail */}
                      <td className="table-cell">
                        {item.photo_id ? (
                          <div className="relative group/photo">
                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                              <ThumbnailImage
                                projectId={item.project_id}
                                photoId={item.photo_id}
                                alt={item.photo_filename || "Photo"}
                                className="w-full h-full object-cover cursor-pointer hover:shadow-md transition-all duration-200"
                              />
                            </div>
                            <div
                              className="absolute inset-0 bg-black bg-opacity-0 group-hover/photo:bg-opacity-20 rounded-lg flex items-center justify-center transition-all duration-200"
                              onClick={() => handlePhotoClick(item)}
                            >
                              <MagnifyingGlassIcon className="h-4 w-4 text-white opacity-0 group-hover/photo:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        ) : (
                          <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <PhotoIcon className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </td>

                      {/* Room/Area - Hide for Coins and Wine */}
                      {detectedItemType !== "Coins" && detectedItemType !== "Wine" && (
                        <td className="table-cell">
                          {editingCell === `${item.id}-room_area` ? (
                            <div className="relative">
                              <input
                                type="text"
                                list={`room-area-list-${item.id}`}
                                defaultValue={item.room_area || ""}
                                className="form-input text-sm uppercase"
                                placeholder="Type or select..."
                                onBlur={(e) =>
                                  handleCellEdit(
                                    item.id,
                                    "room_area",
                                    e.target.value.toUpperCase()
                                  )
                                }
                                onKeyPress={(e) => {
                                  if (e.key === "Enter") {
                                    handleCellEdit(
                                      item.id,
                                      "room_area",
                                      e.target.value.toUpperCase()
                                    );
                                  }
                                }}
                                autoFocus
                              />
                              <datalist id={`room-area-list-${item.id}`}>
                                {schema?.room_area_options?.map((option) => (
                                  <option key={option} value={option} />
                                ))}
                              </datalist>
                            </div>
                          ) : (
                            <div
                              className="text-sm text-gray-900 cursor-pointer hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                              onClick={() =>
                                handleCellClick(item.id, "room_area")
                              }
                            >
                              {item.room_area || (
                                <span className="text-gray-400 italic">
                                  Click to select
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      )}

                      {/* Floor/Building - Hide for Coins and Wine */}
                      {detectedItemType !== "Coins" && detectedItemType !== "Wine" && (
                        <td className="table-cell">
                          {editingCell === `${item.id}-floor_building` ? (
                            <div className="relative">
                              <input
                                type="text"
                                list={`floor-building-list-${item.id}`}
                                defaultValue={item.floor_building || ""}
                                className="form-input text-sm uppercase"
                                placeholder="Type or select..."
                                onBlur={(e) =>
                                  handleCellEdit(
                                    item.id,
                                    "floor_building",
                                    e.target.value.toUpperCase()
                                  )
                                }
                                onKeyPress={(e) => {
                                  if (e.key === "Enter") {
                                    handleCellEdit(
                                      item.id,
                                      "floor_building",
                                      e.target.value.toUpperCase()
                                    );
                                  }
                                }}
                                autoFocus
                              />
                              <datalist id={`floor-building-list-${item.id}`}>
                                {schema?.floor_building_options?.map((option) => (
                                  <option key={option} value={option} />
                                ))}
                              </datalist>
                            </div>
                          ) : (
                            <div
                              className="text-sm text-gray-900 cursor-pointer hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                              onClick={() =>
                                handleCellClick(item.id, "floor_building")
                              }
                            >
                              {item.floor_building || (
                                <span className="text-gray-400 italic">
                                  Click to select
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      )}

                      {/* Type */}
                      <td className="table-cell">
                        {editingCell === `${item.id}-item_type` ? (
                          <select
                            defaultValue={item.item_type || ""}
                            className="form-input text-sm"
                            onBlur={(e) =>
                              handleCellEdit(
                                item.id,
                                "item_type",
                                e.target.value
                              )
                            }
                            onChange={(e) =>
                              handleCellEdit(
                                item.id,
                                "item_type",
                                e.target.value
                              )
                            }
                            autoFocus
                          >
                            <option value="">Select Type</option>
                            {schema?.item_type_options?.sort((a, b) => a.localeCompare(b)).map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div
                            className="cursor-pointer hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                            onClick={() =>
                              handleCellClick(item.id, "item_type")
                            }
                          >
                            {item.item_type ? (
                              <Badge
                                variant="info"
                                size="sm"
                                className="capitalize"
                              >
                                {item.item_type}
                              </Badge>
                            ) : (
                              <span className="text-gray-400 italic text-sm">
                                Click to select
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Description */}
                      <td className="table-cell">
                        {editingCell === `${item.id}-description` ? (
                          <textarea
                            defaultValue={item.description || ""}
                            className="form-input text-sm resize-none"
                            rows="4"
                            style={{ minWidth: "300px" }}
                            onBlur={(e) =>
                              handleCellEdit(
                                item.id,
                                "description",
                                e.target.value
                              )
                            }
                            onKeyPress={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleCellEdit(
                                  item.id,
                                  "description",
                                  e.target.value
                                );
                              }
                            }}
                            autoFocus
                            placeholder={
                              useTemplateMode
                                ? "Select item type to auto-populate template"
                                : "Enter description"
                            }
                          />
                        ) : (
                          <div
                            className="text-sm text-gray-900 cursor-pointer hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-blue-200 max-w-xs"
                            onClick={() =>
                              handleCellClick(item.id, "description")
                            }
                            style={{ maxHeight: "80px", overflow: "hidden" }}
                          >
                            {item.description ? (
                              <div className="whitespace-pre-line text-xs leading-tight">
                                {item.description.length > 100
                                  ? `${item.description.substring(0, 100)}...`
                                  : item.description}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">
                                Click to edit
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Value */}
                      <td className="table-cell">
                        {detectedItemType === "Coins" || detectedItemType === "Wine" ? (
                          <div className="px-3 py-2 rounded-lg">
                            <span className="font-semibold text-green-700">
                              {formatCurrency(item.appraised_value)}
                            </span>
                          </div>
                        ) : (
                          <>
                            {editingCell === `${item.id}-appraised_value` ? (
                              <input
                                type="number"
                                defaultValue={item.appraised_value ?? ""}
                                className="form-input text-sm w-full"
                                onBlur={(e) =>
                                  handleCellEdit(
                                    item.id,
                                    "appraised_value",
                                    e.target.value
                                  )
                                }
                                onKeyPress={(e) => {
                                  if (e.key === "Enter") {
                                    handleCellEdit(
                                      item.id,
                                      "appraised_value",
                                      e.target.value
                                    );
                                  }
                                }}
                                autoFocus
                              />
                            ) : (
                              <div
                                className="text-sm text-gray-900 cursor-pointer hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                                onClick={() =>
                                  handleCellClick(item.id, "appraised_value")
                                }
                              >
                                <span className="font-semibold text-green-700">
                                  {formatCurrency(item.appraised_value)}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </td>

                      {/* Dynamic Attributes - only in multi-field mode */}
                      {!useTemplateMode && renderAttributeColumns(item)}

                      {/* Actions */}
                      <td className="table-cell">
                        <div className="flex items-center space-x-1">
                          <Button
                            onClick={() => handleMoveUp(actualIndex)}
                            disabled={actualIndex === 0}
                            variant="ghost"
                            size="sm"
                            icon={ChevronUpIcon}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                          <Button
                            onClick={() => handleMoveDown(actualIndex)}
                            disabled={actualIndex === items.length - 1}
                            variant="ghost"
                            size="sm"
                            icon={ChevronDownIcon}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Summary Row */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Badge variant="info" size="lg">
                {items.length} Items
              </Badge>
              <span className="text-sm text-gray-600">
                Last updated: {new Date().toLocaleTimeString()}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">
                Total Appraised Value
              </p>
              <p className="text-2xl font-bold text-green-700">
                {formatCurrency(
                  items.reduce(
                    (sum, item) => sum + (item.appraised_value || 0),
                    0
                  )
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Pagination */}
        {items.length > 10 && (
          <div className="bg-white px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Show</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    const newValue = Number(e.target.value);
                    setItemsPerPage(newValue);
                    setCurrentPage(1);
                    // Save preference to localStorage
                    try {
                      localStorage.setItem('appraisalTableItemsPerPage', String(newValue));
                    } catch (error) {
                      console.warn("Could not save items per page preference:", error);
                    }
                  }}
                  className="form-input text-sm w-20 cursor-pointer bg-white border border-gray-300 rounded"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-700">items per page</span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, items.length)} of{" "}
                  {items.length} items
                </span>

                <div className="flex space-x-1">
                  <Button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    variant="ghost"
                    size="sm"
                  >
                    Previous
                  </Button>

                  {Array.from(
                    { length: Math.ceil(items.length / itemsPerPage) },
                    (_, i) => i + 1
                  )
                    .filter((page) => {
                      const totalPages = Math.ceil(items.length / itemsPerPage);
                      return (
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 2
                      );
                    })
                    .map((page, index, array) => {
                      const showEllipsis =
                        index > 0 && array[index - 1] !== page - 1;
                      return (
                        <React.Fragment key={page}>
                          {showEllipsis && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                          <Button
                            onClick={() => setCurrentPage(page)}
                            variant={currentPage === page ? "primary" : "ghost"}
                            size="sm"
                            className="w-8"
                          >
                            {page}
                          </Button>
                        </React.Fragment>
                      );
                    })}

                  <Button
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(
                          prev + 1,
                          Math.ceil(items.length / itemsPerPage)
                        )
                      )
                    }
                    disabled={
                      currentPage === Math.ceil(items.length / itemsPerPage)
                    }
                    variant="ghost"
                    size="sm"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Photo Modal */}
      <Modal
        isOpen={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        title={selectedPhoto?.photo_filename || "Photo"}
        size="lg"
      >
        {selectedPhoto && (
          <div className="space-y-4">
            <img
              src={`${import.meta.env.VITE_API_URL}/api/v1/projects/${
                selectedPhoto.project_id
              }/photos/${selectedPhoto.photo_id}/thumbnail`}
              alt={selectedPhoto.photo_filename || "Photo"}
              className="w-full h-auto rounded-lg shadow-medium"
              onError={(e) => {
                e.target.src =
                  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTAwTDEwMCAxMDBaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K";
              }}
            />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Room/Area:</span>
                <p className="text-gray-900">
                  {selectedPhoto.room_area || "Not specified"}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Type:</span>
                <p className="text-gray-900 capitalize">
                  {selectedPhoto.item_type || "Not specified"}
                </p>
              </div>
              <div className="col-span-2">
                <span className="font-medium text-gray-700">Description:</span>
                <p className="text-gray-900">
                  {selectedPhoto.description || "No description"}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">
                  Appraised Value:
                </span>
                <p className="text-green-700 font-semibold">
                  {formatCurrency(selectedPhoto.appraised_value)}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default AppraisalTable;
