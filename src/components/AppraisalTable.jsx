import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
import { useToast } from "../hooks/useToast";

const ITEM_BULK_PLACEHOLDER = "Select action to perform";
const ITEM_BULK_LABELS = {
  bulk_update_room: "Bulk update room",
};
const LOCATION_CELL_PLACEHOLDER = "Click to select";
const COMBO_NO_MATCHES_HINT =
  "No matches — type in the box above and press Enter for a custom value";
const EMPTY_OPTS = [];
const BULK_CLEAR_SELECTED_OPTION = "__CLEAR_SELECTED__";
const BULK_CLEAR_SELECTED_LABEL = "Clear selected";

function normalizeRoomOrFloorInput(value) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }
  return String(value).trim().toUpperCase();
}

const COMBO_WRAP =
  "flex h-8 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-sm shadow-sm transition-colors hover:border-gray-400 focus-within:border-blue-500 focus-within:outline-none focus-within:ring-1 focus-within:ring-blue-500 disabled:opacity-50";
const COMBO_WRAP_CLOSED_GHOST =
  "flex h-8 w-full min-w-0 items-center gap-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm shadow-none transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 disabled:opacity-50";

function SearchableSelectDropdown({
  ariaLabelledBy,
  ariaLabel,
  triggerLabel,
  placeholderTrigger,
  menuOpen,
  onTriggerClick,
  onClose,
  menuRef,
  options = [],
  onPick,
  triggerClassName = "w-52",
  disabled = false,
  borderOnInteractOnly = false,
  hideChevronWhenClosed = false,
  allowClearOnCommit = false,
}) {
  const [filter, setFilter] = useState("");
  const inputRef = useRef(null);
  const skipBlurCommitRef = useRef(false);
  const triggerLabelRef = useRef(triggerLabel);
  triggerLabelRef.current = triggerLabel;
  const getOptionLabel = useCallback(
    (option) =>
      option === BULK_CLEAR_SELECTED_OPTION ? BULK_CLEAR_SELECTED_LABEL : option,
    []
  );

  useEffect(() => {
    if (!menuOpen) {
      setFilter("");
      return;
    }
    const v = triggerLabelRef.current;
    setFilter(v != null && v !== "" ? String(v) : "");
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [menuOpen]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) =>
      String(getOptionLabel(o)).toLowerCase().includes(q)
    );
  }, [options, filter, getOptionLabel]);

  const notifyPickAndClose = useCallback(
    (raw) => {
      const t = String(raw ?? "").trim();
      if (allowClearOnCommit) {
        onPick(t === "" ? null : t);
        onClose();
        return;
      }
      if (t === "") return;
      onPick(t);
      onClose();
    },
    [allowClearOnCommit, onPick, onClose]
  );

  const selectedDisplay =
    triggerLabel != null && triggerLabel !== ""
      ? String(triggerLabel)
      : null;

  const closedTriggerWrap =
    borderOnInteractOnly && !menuOpen
      ? `${COMBO_WRAP_CLOSED_GHOST} cursor-pointer disabled:cursor-not-allowed`
      : `${COMBO_WRAP} cursor-pointer disabled:cursor-not-allowed`;

  const showClosedChevron = !(hideChevronWhenClosed && !menuOpen);

  return (
    <div className={`relative shrink-0 ${triggerClassName}`} ref={menuRef}>
      {!menuOpen ? (
        <button
          type="button"
          aria-labelledby={ariaLabelledBy ?? undefined}
          aria-label={ariaLabelledBy ? undefined : ariaLabel}
          aria-haspopup="listbox"
          aria-expanded={false}
          disabled={disabled}
          onClick={() => !disabled && onTriggerClick()}
          className={closedTriggerWrap}
        >
          <span
            className={`min-w-0 flex-1 truncate text-left ${selectedDisplay ? "text-gray-900" : "text-gray-400"}`}
          >
            {selectedDisplay ?? placeholderTrigger}
          </span>
          {showClosedChevron && (
            <ChevronDownIcon
              className={`h-4 w-4 shrink-0 ${selectedDisplay && borderOnInteractOnly ? "text-gray-400" : "text-gray-500"}`}
            />
          )}
        </button>
      ) : (
        <div
          className={COMBO_WRAP}
          role="combobox"
          aria-expanded={true}
          aria-haspopup="listbox"
          aria-labelledby={ariaLabelledBy ?? undefined}
          aria-label={ariaLabelledBy ? undefined : ariaLabel}
        >
          <input
            ref={inputRef}
            type="text"
            className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm uppercase text-gray-900 outline-none placeholder:text-gray-400 placeholder:normal-case"
            placeholder={placeholderTrigger}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            onBlur={(e) => {
              if (!allowClearOnCommit || skipBlurCommitRef.current) return;
              const rt = e.relatedTarget;
              if (rt?.closest?.("[role=listbox]")) return;
              if (rt?.closest?.("[role=combobox]")) return;
              notifyPickAndClose(filter);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                skipBlurCommitRef.current = true;
                notifyPickAndClose(filter);
                requestAnimationFrame(() => {
                  skipBlurCommitRef.current = false;
                });
              }
              if (e.key === "Escape") {
                e.preventDefault();
                onClose();
              }
            }}
            onMouseDown={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            tabIndex={-1}
            className="ml-1 shrink-0 rounded p-0.5 text-gray-500 hover:bg-gray-100"
            aria-label="Close list"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
          >
            <ChevronDownIcon className="h-4 w-4 rotate-180" />
          </button>
        </div>
      )}
      {menuOpen && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-[100] mt-1 max-h-60 min-w-full overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
        >
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.map((option) => (
              <li key={option} role="none">
                <button
                  type="button"
                  role="option"
                  className="flex w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onPick(option);
                    onClose();
                  }}
                >
                  {getOptionLabel(option)}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-500">
                {COMBO_NO_MATCHES_HINT}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function ItemLocationComboboxCell({
  item,
  field,
  options,
  openOptionPicker,
  setOpenOptionPicker,
  ariaLabel,
  onPick,
}) {
  const pickerKey = `${item.id}-${field}`;
  const value = item[field];
  return (
    <td
      className="table-cell align-middle"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        data-searchable-option-picker
        className="min-w-[140px] max-w-[260px]"
      >
        <SearchableSelectDropdown
          ariaLabel={ariaLabel}
          triggerLabel={value || null}
          placeholderTrigger={LOCATION_CELL_PLACEHOLDER}
          menuOpen={openOptionPicker === pickerKey}
          onTriggerClick={() =>
            setOpenOptionPicker((prev) =>
              prev === pickerKey ? null : pickerKey
            )
          }
          onClose={() =>
            setOpenOptionPicker((cur) => (cur === pickerKey ? null : cur))
          }
          options={options}
          onPick={onPick}
          triggerClassName="w-full"
          borderOnInteractOnly
          hideChevronWhenClosed
          allowClearOnCommit
        />
      </div>
    </td>
  );
}

// PhotoModal component to display photo with auth token
const PhotoModal = ({ photo }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPhoto = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/projects/${photo.project_id}/photos/${photo.photo_id}/thumbnail`, {
          responseType: 'blob'
        });
        const imageUrl = URL.createObjectURL(response.data);
        setImageSrc(imageUrl);
      } catch (err) {
        console.error('Error loading photo:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPhoto();

    return () => {
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [photo]);

  const formatCurrency = (value) => {
    if (!value) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  return (
    <div className="space-y-4 flex flex-col max-h-[calc(100vh-100px)]">
      <div className="flex-1 overflow-hidden flex items-center justify-center rounded-lg">
        {loading ? (
          <div className="w-full h-full rounded-lg shadow-medium bg-gray-200 animate-pulse" style={{ minHeight: '550px' }}></div>
        ) : imageSrc ? (
          <img
            src={imageSrc}
            alt={photo.photo_filename || "Photo"}
            className="max-w-full max-h-[calc(100vh-120px)] object-contain rounded-lg shadow-medium"
          />
        ) : (
          <div className="w-full h-full rounded-lg shadow-medium bg-gray-100 flex items-center justify-center" style={{ minHeight: '550px' }}>
            <p className="text-gray-500">Failed to load photo</p>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm overflow-y-auto">
        <div>
          <span className="font-medium text-gray-700">Room/Area:</span>
          <p className="text-gray-900">
            {photo.room_area || "Not specified"}
          </p>
        </div>
        <div>
          <span className="font-medium text-gray-700">Type:</span>
          <p className="text-gray-900 capitalize">
            {photo.item_type || "Not specified"}
          </p>
        </div>
        <div className="col-span-2">
          <span className="font-medium text-gray-700">Description:</span>
          <p className="text-gray-900">
            {photo.description || "No description"}
          </p>
        </div>
        <div>
          <span className="font-medium text-gray-700">Floor/Building:</span>
          <p className="text-gray-900">
            {photo.floor_building || "Not specified"}
          </p>
        </div>
        <div>
          <span className="font-medium text-gray-700">
            Appraised Value:
          </span>
          <p className="text-green-700 font-semibold">
            {formatCurrency(photo.appraised_value)}
          </p>
        </div>
      </div>
    </div>
  );
};

const AppraisalTable = ({ items, onItemUpdate, onItemsReorder, loading, project, detectedItemType, allowBulkToolbar = false, onBulkItemsChanged, }) => {
  const { showSuccess, showError } = useToast();
  const [draggedItem, setDraggedItem] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [schema, setSchema] = useState(null);
  const [expandedAttributes, setExpandedAttributes] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [useTemplateMode, setUseTemplateMode] = useState(true); // Default to template mode

  const [selectedItemIds, setSelectedItemIds] = useState(() => new Set());
  const [itemBulkMenuOpen, setItemBulkMenuOpen] = useState(false);
  const [itemActionTriggerLabel, setItemActionTriggerLabel] = useState(null);
  const [bulkRoomToolbarVisible, setBulkRoomToolbarVisible] = useState(false);
  const [roomBulkMenuOpen, setRoomBulkMenuOpen] = useState(false);
  const [roomActionTriggerLabel, setRoomActionTriggerLabel] = useState(null);
  const [floorBulkMenuOpen, setFloorBulkMenuOpen] = useState(false);
  const [floorActionTriggerLabel, setFloorActionTriggerLabel] = useState(null);
  const [openOptionPicker, setOpenOptionPicker] = useState(null);
  const [inlineDeleteModalOpen, setInlineDeleteModalOpen] = useState(false);
  const [pendingDeleteItem, setPendingDeleteItem] = useState(null);
  const [inlineDeleteSubmitting, setInlineDeleteSubmitting] = useState(false);
  const itemBulkMenuRef = useRef(null);
  const roomBulkMenuRef = useRef(null);
  const floorBulkMenuRef = useRef(null);
  const selectAllHeaderCheckboxRef = useRef(null);

  const showRoomBulk =
    detectedItemType !== "Coins" && detectedItemType !== "Wine";

  const itemBulkKeys = useMemo(
    () => [...(showRoomBulk ? ["bulk_update_room"] : [])],
    [showRoomBulk]
  );

  useEffect(() => {
    setSelectedItemIds(new Set());
    setItemBulkMenuOpen(false);
    setRoomBulkMenuOpen(false);
    setFloorBulkMenuOpen(false);
    setOpenOptionPicker(null);
    setItemActionTriggerLabel(null);
    setRoomActionTriggerLabel(null);
    setFloorActionTriggerLabel(null);
    setBulkRoomToolbarVisible(false);
  }, [currentPage, itemsPerPage]);
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

  useEffect(() => {
    const validIds = new Set(items.map((i) => i.id));
    setSelectedItemIds((prev) => {
      let changed = false;
      const next = new Set();
      prev.forEach((id) => {
        if (validIds.has(id)) next.add(id);
        else changed = true;
      });
      if (prev.size !== next.size) changed = true;
      return changed ? next : prev;
    });
  }, [items]);

  useEffect(() => {
    const onDoc = (e) => {
      if (
        itemBulkMenuRef.current &&
        !itemBulkMenuRef.current.contains(e.target)
      ) {
        setItemBulkMenuOpen(false);
      }
      if (
        roomBulkMenuRef.current &&
        !roomBulkMenuRef.current.contains(e.target)
      ) {
        setRoomBulkMenuOpen(false);
      }
      if (
        floorBulkMenuRef.current &&
        !floorBulkMenuRef.current.contains(e.target)
      ) {
        setFloorBulkMenuOpen(false);
      }
      if (
        openOptionPicker &&
        !e.target.closest("[data-searchable-option-picker]")
      ) {
        setOpenOptionPicker(null);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [openOptionPicker]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setItemBulkMenuOpen(false);
        setRoomBulkMenuOpen(false);
        setFloorBulkMenuOpen(false);
        setOpenOptionPicker(null);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
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
      // Parse Coins template: "Quantity: X" and "Value Per Coin $: Y" (with optional $ sign)
      if (isCoin) {
        const quantityMatch = description.match(/Quantity:\s*(\d+(?:\.\d+)?)/i);
        // Updated pattern to handle optional $ sign and commas: "$25.00" or "25.00" or "$1,250.50"
        const priceMatch = description.match(/Value Per Coin \$:\s*\$?\s*([\d,]+(?:\.\d+)?)/i);
        
        if (quantityMatch && priceMatch) {
          const quantity = parseFloat(quantityMatch[1]) || 0;
          // Strip $ and commas before parsing
          const priceStr = priceMatch[1].replace(/\$/g, '').replace(/,/g, '');
          const pricePerCoin = parseFloat(priceStr) || 0;
          return quantity * pricePerCoin;
        }
      }
      
      // Parse Wine template: "Quantity: X" and "Per Bottle Price: Y" (with optional $ sign)
      if (isWine) {
        const quantityMatch = description.match(/Quantity:\s*(\d+(?:\.\d+)?)/i);
        // Updated pattern to handle optional $ sign and commas: "$100" or "100" or "$1,250.50"
        const priceMatch = description.match(/Per Bottle Price:\s*\$?\s*([\d,]+(?:\.\d+)?)/i);
        
        if (quantityMatch && priceMatch) {
          const quantity = parseFloat(quantityMatch[1]) || 0;
          // Strip $ and commas before parsing
          const priceStr = priceMatch[1].replace(/\$/g, '').replace(/,/g, '');
          const pricePerBottle = parseFloat(priceStr) || 0;
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
      } else if (field === "room_area" || field === "floor_building") {
        onItemUpdate(itemId, {
          [field]: normalizeRoomOrFloorInput(value),
        });
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

  const pageSliceStart = (currentPage - 1) * itemsPerPage;
  const pageItemsView = items.slice(
    pageSliceStart,
    pageSliceStart + itemsPerPage
  );
  const someItemsSelectedOnPage = pageItemsView.some((i) =>
    selectedItemIds.has(i.id)
  );
  const allSelectedOnPage =
    pageItemsView.length > 0 &&
    pageItemsView.every((i) => selectedItemIds.has(i.id));

  useEffect(() => {
    const el = selectAllHeaderCheckboxRef.current;
    if (!el) return;
    el.indeterminate =
      pageItemsView.length > 0 &&
      someItemsSelectedOnPage &&
      !allSelectedOnPage;
  }, [
    pageItemsView.length,
    someItemsSelectedOnPage,
    allSelectedOnPage,
  ]);

  const toggleSelectItem = (itemId) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const deselectAllItemsOnPage = () => {
    const pageIds = new Set(pageItemsView.map((i) => i.id));
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      pageIds.forEach((id) => next.delete(id));
      return next;
    });
  };

  const toggleSelectPageSelection = () => {
    if (pageItemsView.length === 0) return;
    if (allSelectedOnPage) {
      deselectAllItemsOnPage();
    } else {
      setSelectedItemIds(new Set(pageItemsView.map((i) => i.id)));
    }
  };

  const resetItemBulkToNeutral = () => {
    setItemBulkMenuOpen(false);
    setItemActionTriggerLabel(null);
    setBulkRoomToolbarVisible(false);
    setRoomActionTriggerLabel(null);
    setFloorActionTriggerLabel(null);
    setRoomBulkMenuOpen(false);
    setFloorBulkMenuOpen(false);
  };

  const runItemBulkAction = (key) => {
    setItemBulkMenuOpen(false);
    setItemActionTriggerLabel(ITEM_BULK_LABELS[key]);
    if (key === "bulk_update_room") {
      setBulkRoomToolbarVisible(true);
    } else {
      setBulkRoomToolbarVisible(false);
      setRoomActionTriggerLabel(null);
      setFloorActionTriggerLabel(null);
      setFloorBulkMenuOpen(false);
    }
    switch (key) {
      case "bulk_update_room":
        break;
      default:
        break;
    }
  };

  const applyRoomBulkToSelection = async (room) => {
    const ids = Array.from(selectedItemIds);
    if (ids.length === 0) {
      showError("Select at least one item.");
      return;
    }
    const shouldClear = room === BULK_CLEAR_SELECTED_OPTION;
    const roomValue = shouldClear ? null : String(room).toUpperCase();
    try {
      await Promise.all(
        ids.map((id) => onItemUpdate(id, { room_area: roomValue }))
      );
      if (shouldClear) {
        showSuccess(`Cleared room/area for ${ids.length} item(s).`);
        setRoomActionTriggerLabel(null);
      } else {
        showSuccess(`Updated room/area for ${ids.length} item(s).`);
        setRoomActionTriggerLabel(roomValue);
      }
    } catch {
      showError("Could not update all items.");
    } finally {
      setRoomBulkMenuOpen(false);
    }
  };

  const applyFloorBulkToSelection = async (floor) => {
    const ids = Array.from(selectedItemIds);
    if (ids.length === 0) {
      showError("Select at least one item.");
      return;
    }
    const shouldClear = floor === BULK_CLEAR_SELECTED_OPTION;
    const floorValue = shouldClear ? null : String(floor).toUpperCase();
    try {
      await Promise.all(
        ids.map((id) => onItemUpdate(id, { floor_building: floorValue }))
      );
      if (shouldClear) {
        showSuccess(`Cleared floor/building for ${ids.length} item(s).`);
        setFloorActionTriggerLabel(null);
      } else {
        showSuccess(`Updated floor/building for ${ids.length} item(s).`);
        setFloorActionTriggerLabel(floorValue);
      }
    } catch {
      showError("Could not update all items.");
    } finally {
      setFloorBulkMenuOpen(false);
    }
  };

  const openInlineDeleteModal = (item) => {
    setPendingDeleteItem(item);
    setInlineDeleteModalOpen(true);
  };

  const closeInlineDeleteModal = () => {
    if (inlineDeleteSubmitting) return;
    setInlineDeleteModalOpen(false);
    setPendingDeleteItem(null);
  };

  const confirmInlineDelete = async () => {
    if (inlineDeleteSubmitting || !pendingDeleteItem?.id) return;
    const deleteItemId = pendingDeleteItem.id;
    const pid = project?.id ?? pendingDeleteItem.project_id;
    if (!pid) return;
    setInlineDeleteSubmitting(true);
    try {
      await appraisalService.deleteAppraisalItem(pid, deleteItemId);
      if (onBulkItemsChanged) await onBulkItemsChanged();
      showSuccess("Item deleted successfully.");
      setInlineDeleteModalOpen(false);
      setPendingDeleteItem(null);
      setSelectedItemIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteItemId);
        return next;
      });
    } catch (e) {
      console.error(e);
      showError("Failed to delete item.");
    } finally {
      setInlineDeleteSubmitting(false);
    }
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
        {allowBulkToolbar && (
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50/40">
            <span
              id="item-bulk-action-label"
              className="text-sm font-medium text-gray-700 shrink-0 leading-none"
            >
              Action
            </span>
            <div className="relative shrink-0" ref={itemBulkMenuRef}>
              <button
                type="button"
                id="item-bulk-action"
                aria-labelledby="item-bulk-action-label item-bulk-action"
                aria-haspopup="listbox"
                aria-expanded={itemBulkMenuOpen}
                onClick={() => setItemBulkMenuOpen((o) => !o)}
                className="flex h-8 w-52 items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-sm shadow-sm transition-colors hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <span
                  className={`truncate ${itemActionTriggerLabel ? "text-gray-900" : "text-gray-500"}`}
                >
                  {itemActionTriggerLabel || ITEM_BULK_PLACEHOLDER}
                </span>
                <ChevronDownIcon
                  className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${itemBulkMenuOpen ? "rotate-180" : ""}`}
                />
              </button>
              {itemBulkMenuOpen && (
                <ul
                  role="listbox"
                  aria-labelledby="item-bulk-action-label"
                  className="absolute left-0 top-full z-[100] mt-1 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
                >
                  <li role="none">
                    <button
                      type="button"
                      role="option"
                      className="flex w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => resetItemBulkToNeutral()}
                    >
                      {ITEM_BULK_PLACEHOLDER}
                    </button>
                  </li>
                  {itemBulkKeys.map((key) => {
                    const disabled =
                      (key === "bulk_update_room" &&
                        selectedItemIds.size === 0);
                    return (
                      <li key={key} role="none">
                        <button
                          type="button"
                          role="option"
                          disabled={disabled}
                          onClick={() => runItemBulkAction(key)}
                          className="flex w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
                        >
                          {ITEM_BULK_LABELS[key]}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {bulkRoomToolbarVisible &&
              showRoomBulk &&
              (schema?.room_area_options?.length > 0 ||
                schema?.floor_building_options?.length > 0) && (
              <>
                {schema?.room_area_options?.length > 0 && (
                  <>
                    <span
                      id="item-room-bulk-label"
                      className="text-sm font-medium text-gray-700 shrink-0 leading-none"
                    >
                      Room/Area
                    </span>
                    <SearchableSelectDropdown
                      ariaLabelledBy="item-room-bulk-label"
                      triggerLabel={roomActionTriggerLabel}
                      placeholderTrigger="Select Room/Area"
                      menuOpen={roomBulkMenuOpen}
                      onTriggerClick={() => {
                        setRoomBulkMenuOpen((o) => !o);
                        setFloorBulkMenuOpen(false);
                      }}
                      onClose={() => setRoomBulkMenuOpen(false)}
                      menuRef={roomBulkMenuRef}
                      options={[
                        BULK_CLEAR_SELECTED_OPTION,
                        ...(schema.room_area_options ?? EMPTY_OPTS),
                      ]}
                      onPick={(option) => applyRoomBulkToSelection(option)}
                      triggerClassName="w-52"
                      disabled={selectedItemIds.size === 0}
                    />
                  </>
                )}
                {schema?.floor_building_options?.length > 0 && (
                  <>
                    <span
                      id="item-floor-bulk-label"
                      className="text-sm font-medium text-gray-700 shrink-0 leading-none"
                    >
                      Floor/Bldg
                    </span>
                    <SearchableSelectDropdown
                      ariaLabelledBy="item-floor-bulk-label"
                      triggerLabel={floorActionTriggerLabel}
                      placeholderTrigger="Select Floor/Building"
                      menuOpen={floorBulkMenuOpen}
                      onTriggerClick={() => {
                        setFloorBulkMenuOpen((o) => !o);
                        setRoomBulkMenuOpen(false);
                      }}
                      onClose={() => setFloorBulkMenuOpen(false)}
                      menuRef={floorBulkMenuRef}
                      options={[
                        BULK_CLEAR_SELECTED_OPTION,
                        ...(schema.floor_building_options ?? EMPTY_OPTS),
                      ]}
                      onPick={(option) => applyFloorBulkToSelection(option)}
                      triggerClassName="w-52"
                      disabled={selectedItemIds.size === 0}
                    />
                  </>
                )}
              </>
            )}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                {allowBulkToolbar && (
                  <th className="table-header-cell w-10 px-2 py-3 align-middle">
                    <div className="flex justify-center items-center">
                      <input
                        ref={selectAllHeaderCheckboxRef}
                        type="checkbox"
                        checked={allSelectedOnPage}
                        disabled={pageItemsView.length === 0}
                        onChange={toggleSelectPageSelection}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-40"
                        aria-label={
                          allSelectedOnPage
                            ? "Deselect all rows on this page"
                            : "Select all rows on this page"
                        }
                        title={
                          allSelectedOnPage
                            ? "Deselect all on this page"
                            : "Select all on this page"
                        }
                      />
                    </div>
                  </th>
                )}
                <th className="table-header-cell w-16">#</th>
                <th className="table-header-cell w-20 text-center">Photo</th>
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
              {pageItemsView.map((item, index) => {
                  const actualIndex = pageSliceStart + index;
                  return (
                    <tr
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item, actualIndex)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, actualIndex)}
                      className="table-row cursor-move group"
                    >
                      {allowBulkToolbar && (
                        <td
                          className="table-cell w-10 px-2 py-3 align-middle"
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <div className="flex justify-center items-center">
                            <input
                              type="checkbox"
                              checked={selectedItemIds.has(item.id)}
                              onChange={() => toggleSelectItem(item.id)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              aria-label={`Select line ${item.line_number}`}
                            />
                          </div>
                        </td>
                      )}
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
                      <td className="table-cell align-middle">
                        <div className="flex justify-center items-center">
                        {item.photo_id ? (
                          <div className="relative group/photo shrink-0">
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
                          <div className="h-12 w-12 shrink-0 bg-gray-100 rounded-lg flex items-center justify-center">
                            <PhotoIcon className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        </div>
                      </td>

                      {/* Room/Area - Hide for Coins and Wine */}
                      {detectedItemType !== "Coins" &&
                        detectedItemType !== "Wine" && (
                          <ItemLocationComboboxCell
                            item={item}
                            field="room_area"
                            options={
                              schema?.room_area_options ?? EMPTY_OPTS
                            }
                            openOptionPicker={openOptionPicker}
                            setOpenOptionPicker={setOpenOptionPicker}
                            ariaLabel={`Room or area for item ${item.line_number}`}
                            onPick={(v) =>
                              handleCellEdit(item.id, "room_area", v)
                            }
                          />
                        )}

                      {/* Floor/Building - Hide for Coins and Wine */}
                      {detectedItemType !== "Coins" &&
                        detectedItemType !== "Wine" && (
                          <ItemLocationComboboxCell
                            item={item}
                            field="floor_building"
                            options={
                              schema?.floor_building_options ?? EMPTY_OPTS
                            }
                            openOptionPicker={openOptionPicker}
                            setOpenOptionPicker={setOpenOptionPicker}
                            ariaLabel={`Floor or building for item ${item.line_number}`}
                            onPick={(v) =>
                              handleCellEdit(item.id, "floor_building", v)
                            }
                          />
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
                            {(schema?.item_type_options
                              ? [...schema.item_type_options].sort((a, b) =>
                                  a.localeCompare(b)
                                )
                              : []
                            ).map((option) => (
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
                        {editingCell === `${item.id}-appraised_value` ? (
                          <input
                            type="number"
                            value={item.appraised_value ?? ""}
                            className="form-input text-sm w-full"
                            onChange={(e) => {
                              // Update value without closing the edit cell
                              const numericValue = e.target.value === "" || e.target.value === null ? null : Number(e.target.value);
                              onItemUpdate(item.id, { appraised_value: isNaN(numericValue) ? null : numericValue });
                            }}
                            onBlur={() => setEditingCell(null)}
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                setEditingCell(null);
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
                      </td>

                      {/* Dynamic Attributes - only in multi-field mode */}
                      {!useTemplateMode && renderAttributeColumns(item)}

                      {/* Actions */}
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleMoveUp(actualIndex)}
                            disabled={actualIndex === 0}
                            className="inline-flex items-center justify-center rounded-lg p-1.5 text-gray-700 transition-all duration-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 opacity-0 group-hover:opacity-100"
                            aria-label={`Move line ${item.line_number} up`}
                            title="Move up"
                          >
                            <ChevronUpIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveDown(actualIndex)}
                            disabled={actualIndex === items.length - 1}
                            className="inline-flex items-center justify-center rounded-lg p-1.5 text-gray-700 transition-all duration-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 opacity-0 group-hover:opacity-100"
                            aria-label={`Move line ${item.line_number} down`}
                            title="Move down"
                          >
                            <ChevronDownIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openInlineDeleteModal(item)}
                            className="inline-flex text-red-600 hover:text-red-900 p-0.5"
                            title="Delete item"
                            aria-label={`Delete line ${item.line_number}`}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
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
                {project?.appraisal_type === 'INSURANCE' || project?.appraisal_type === 'REPLACEMENT' ? 'Total Replacement Value' : 'Total Appraised Value'}
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

      <Modal
        isOpen={inlineDeleteModalOpen}
        onClose={closeInlineDeleteModal}
        title="Delete item"
        size="md"
        closeOnOverlayClick={!inlineDeleteSubmitting}
      >
        <div className="space-y-6">
          <p className="text-gray-700 leading-relaxed">
            Are you sure you want to delete this appraisal item? This cannot be
            undone.
          </p>
          <div className="flex justify-end space-x-3 pt-2 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={closeInlineDeleteModal}
              disabled={inlineDeleteSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmInlineDelete}
              loading={inlineDeleteSubmitting}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Photo Modal */}
      <Modal
        isOpen={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        title={selectedPhoto?.photo_filename || "Photo"}
        size="lg"
      >
        {selectedPhoto && (
          <PhotoModal photo={selectedPhoto} />
        )}
      </Modal>
    </>
  );
};

export default AppraisalTable;
