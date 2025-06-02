import React, { useState, useEffect, useRef } from 'react';

// Helper function to save inventory to local storage
const saveInventoryToLocalStorage = (inventoryData) => {
  try {
    localStorage.setItem('inventory', JSON.stringify(inventoryData));
    console.log("Local storage updated:", inventoryData); // Debug log
  } catch (error) {
    console.error("Error saving to local storage:", error);
    // You might want to display an alert to the user here
  }
};

// Helper function to save master item names to local storage
const saveMasterItemsToLocalStorage = (masterItemsData) => {
  try {
    localStorage.setItem('masterItems', JSON.stringify(masterItemsData));
    console.log("Master items local storage updated:", masterItemsData); // Debug log
  } catch (error) {
    console.error("Error saving master items to local storage:", error);
  }
};

// Define a fixed palette of slightly darker pastel colors
const COLORS = [
  '#FFC0CB', // Pink
  '#FFB6C1', // Light Pink
  '#B0C4DE', // Light Steel Blue
  '#C6A4D9', // Lavender (darker)
  '#87CEEB', // Sky Blue
  '#ADD8E6', // Light Blue
  '#AFEEEE', // Pale Turquoise
  '#7FFFD4', // Aquamarine
  '#90EE90', // Light Green
  '#ADFF2F', // Green Yellow
  '#FFFFE0', // Light Yellow
  '#FFD700', // Gold
  '#FFA07A', // Light Salmon
  '#FF7F50', // Coral
  '#CD5C5C', // Indian Red
  '#DDA0DD', // Plum
  '#DA70D6', // Orchid
  '#EE82EE', // Violet
  '#D8BFD8', // Thistle
  '#F0E68C', // Khaki
  '#EEDD82', // Light Goldenrod
  '#BDB76B', // Dark Khaki
  '#C0C0C0', // Silver
  '#A9A9A9', // Dark Gray
];

// Default master list from AUGMENTIN 457MG.txt
const DEFAULT_MASTER_LIST = [
  "AUGMENTIN 457MG",
  "AUGMENTIN 228.5MG",
  "AGUCLAV",
  "MAXIMILIAN- DDS",
  "MEGA-CV 228.5",
  "MEGA-CV 457MG",
  "CALPOL DROP",
  "ASCOTOR LS JUNIOR",
  "SPID COLD-P",
  "SYRUP A TO Z",
  "SYRUP VENTILEX A",
  "SYRUP ARISTOKOF DM+",
  "SYRUP PLANOKUF",
  "SYRUP CALPOL 250",
  "SYRUP ZIMOL-I",
  "SYRUP CODODEX-LC",
  "SYRUP FLUMONT-LC",
  "Tab- CYRA",
  "Tab-SPID COLD",
  "Tab-CONOS-25",
  "Tab-SARTIDOL",
  "Tab-ONDET-MD",
  "Tab-LOMO-D",
  "Tab-PANTATAC DSR",
  "TAB-ZENKIND -OZ",
  "Tab-OFLOTAS-OZ",
  "Tab-RABITOREMED-DSR",
  "Tab-RABITAC-DSR",
  "Tab.RIBJOP-DSR",
  "Tab-RABEZ 20",
  "CAPSULE-PSYLAX INGA",
  "MIC GERMINA",
  "SYRUP CYRA-MPS",
  "SYRUP CONSTIPAC PLUS",
  "Tab-MONTINA-FX",
  "Tab-BILAZAP M",
  "Tab-FLUMONT-LC",
  "EAR DROPS",
  "Tab-ACECLORAN MR",
  "TAB-FLUMONT-LC KIND",
  "Tab-PREGANOX NT",
  "Tab-LYSOFLAM",
  "Tab- LYSOFLAM MR",
  "Tab- LYSOFLAM MR FORTE",
  "Tab-LYSOSPAS",
  "ENERGY DRINK",
  "Tab-PLEOFROL 60K",
  "SACHET BLUVIT-D",
  "SACHET NUCACIUM",
  "Tab-CALPOL 650",
  "Tab-CALPOL 500",
  "Tab-DOLOBRAKE-MR",
  "Tab-PLARICA"
];


// Main App Component
const App = () => {
  const [inventory, setInventory] = useState([]);
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [newItemColor, setNewItemColor] = useState(COLORS[COLORS.length - 1]); // Default to the last color in the palette
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // This holds the item being edited
  const [editQuantity, setEditQuantity] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null); // Stores ID for pending deletion
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [jsonImportText, setJsonImportText] = useState('');
  const [viewMode, setViewMode] = useState('tiles'); // New state: 'tiles' or 'table'
  const [searchTerm, setSearchTerm] = useState(''); // New state for search term

  // New states for item master / autocomplete
  const [masterItemNames, setMasterItemNames] = useState([]);
  const [nameSuggestions, setNameSuggestions] = useState([]);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const nameInputRef = useRef(null); // Ref for the item name input

  // New states for drag and drop
  const [draggedItemId, setDraggedItemId] = useState(null);
  const [dragOverItemId, setDragOverItemId] = useState(null);

  // New state for master list upload modal
  const [isMasterListModalVisible, setIsMasterListModalVisible] = useState(false);
  const masterListFileInputRef = useRef(null);

  // New state for sorting in table view: { column: 'name' | 'quantity', direction: 'asc' | 'desc' }
  const [sortConfig, setSortConfig] = useState({ column: null, direction: 'asc' });


  // Function to show custom alert message
  const showAlert = (message) => {
    setAlertMessage(message);
    setIsAlertVisible(true);
  };

  // Function to hide custom alert message
  const hideAlert = () => {
    setAlertMessage(''); // Clear message first
    setIsAlertVisible(false);
    setConfirmingDeleteId(null); // Crucial: Clear confirming ID when alert is hidden
  };

  // Function to generate random items
  const generateRandomItems = (count) => {
    const items = [];
    const availableNames = [...DEFAULT_MASTER_LIST]; // Use a copy to avoid modifying the original
    for (let i = 0; i < count; i++) {
      const randomNameIndex = Math.floor(Math.random() * availableNames.length);
      const name = availableNames.splice(randomNameIndex, 1)[0] || `Random Item ${i + 1}`; // Remove selected name

      const randomQuantity = Math.floor(Math.random() * 100) + 1; // 1 to 100
      const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
      const isFavorite = Math.random() > 0.5; // 50% chance

      items.push({
        id: Date.now().toString() + i, // Ensure unique ID even if Date.now() is same
        name: name,
        quantity: randomQuantity,
        isFavorite: isFavorite,
        color: randomColor,
      });
    }
    return items;
  };

  // Data Loading from Local Storage on Mount
  useEffect(() => {
    console.log("App component mounted. Current inventory state (initial):", inventory); // Debug log
    try {
      const storedInventory = localStorage.getItem('inventory');
      let initialInventory = [];

      if (storedInventory) {
        const parsedInventory = JSON.parse(storedInventory);
        // Ensure old items get isFavorite and color properties if missing
        const inventoryWithDefaults = parsedInventory.map(item => ({
          ...item,
          isFavorite: item.hasOwnProperty('isFavorite') ? item.isFavorite : false, // Default to false if not present
          color: item.hasOwnProperty('color') ? item.color : COLORS[COLORS.length - 1] // Default to last palette color if not present
        }));
        initialInventory = inventoryWithDefaults;
        console.log("Inventory loaded from local storage:", initialInventory); // Debug log
      } else {
        // If local storage is empty, add 5 random items
        const randomItems = generateRandomItems(5);
        initialInventory = randomItems;
        saveInventoryToLocalStorage(randomItems); // Save generated items to local storage
        console.log("No inventory found in local storage. Added 5 random items:", randomItems); // Debug log
      }

      // Re-sort on load to ensure favorites are at the top
      const favorites = initialInventory.filter(item => item.isFavorite);
      const nonFavorites = initialInventory.filter(item => !item.isFavorite);
      setInventory([...favorites, ...nonFavorites]);


      // Load master items, or use default if none found
      const storedMasterItems = localStorage.getItem('masterItems');
      let parsedMasterItems = [];
      try {
        if (storedMasterItems) {
          parsedMasterItems = JSON.parse(storedMasterItems);
        }
      } catch (e) {
        console.error("Error parsing stored master items, using default:", e);
        // If parsing fails, parsedMasterItems remains an empty array, which is fine for the next check
      }

      if (parsedMasterItems.length > 0) {
        setMasterItemNames(parsedMasterItems);
        console.log("Master items loaded from local storage:", parsedMasterItems);
      } else {
        // Set default master list if nothing in local storage or parsing failed
        setMasterItemNames(DEFAULT_MASTER_LIST);
        saveMasterItemsToLocalStorage(DEFAULT_MASTER_LIST); // Save default to local storage
        console.log("Default master items loaded and saved to local storage:", DEFAULT_MASTER_LIST);
      }

    } catch (error) {
      console.error("Error loading from local storage:", error);
      showAlert("Failed to load inventory from local storage.");
    }
  }, []); // Empty dependency array means this runs once on component mount

  // Update master items whenever inventory changes (merging with default list)
  useEffect(() => {
    // Get unique names from current inventory
    const namesFromInventory = inventory.map(item => item.name);
    
    // Combine names from inventory and default list
    const allPossibleNames = new Set([
      ...DEFAULT_MASTER_LIST, // Always include default names
      ...namesFromInventory   // Include names from current inventory
    ]);

    const uniqueAndSortedNames = [...allPossibleNames].sort();

    // Only update and save if the combined and sorted list is different from the current masterItemNames
    // This prevents infinite loops and unnecessary local storage writes.
    // We compare against the *current* state of masterItemNames.
    if (JSON.stringify(uniqueAndSortedNames) !== JSON.stringify([...masterItemNames].sort())) { // Clone masterItemNames before sorting for comparison
        setMasterItemNames(uniqueAndSortedNames);
        saveMasterItemsToLocalStorage(uniqueAndSortedNames);
        console.log("Master item names updated to:", uniqueAndSortedNames); // Debug log
    }
  }, [inventory]); // Only depend on inventory. masterItemNames is the state being set.


  // Inventory Management Functions (Local Storage Operations)

  const handleAddItem = () => {
    if (!newItemName || !newItemQuantity) {
      showAlert('Please fill all fields.');
      return;
    }

    const quantityNum = parseInt(newItemQuantity, 10);
    if (isNaN(quantityNum) || quantityNum < 0) {
      showAlert('Quantity must be a non-negative number.');
      return;
    }

    // Check if an item with this name already exists in the current inventory
    const existingItemIndex = inventory.findIndex(
      item => item.name.toLowerCase() === newItemName.toLowerCase()
    );

    let updatedInventory;
    let message;

    if (existingItemIndex > -1) {
      // If item exists, update its quantity
      updatedInventory = inventory.map((item, index) =>
        index === existingItemIndex
          ? { ...item, quantity: item.quantity + quantityNum }
          : item
      );
      message = `Quantity for "${newItemName}" updated successfully!`;
    } else {
      // If item does not exist, add a new one
      const newItem = {
        id: Date.now().toString(), // Simple unique ID for local storage
        name: newItemName,
        quantity: quantityNum,
        isFavorite: false, // New items are not favorited by default
        color: newItemColor, // Include the selected color
      };
      updatedInventory = [...inventory, newItem];
      message = 'Item added successfully!';
    }

    // Re-sort after adding/updating to ensure favorites are at the top
    const favorites = updatedInventory.filter(item => item.isFavorite);
    const nonFavorites = updatedInventory.filter(item => !item.isFavorite);
    const finalInventory = [...favorites, ...nonFavorites];

    setInventory(finalInventory);
    saveInventoryToLocalStorage(finalInventory); // Save to local storage

    setAddModalVisible(false);
    setNewItemName('');
    setNewItemQuantity('');
    setNewItemColor(COLORS[COLORS.length - 1]); // Reset color to default for next add
    showAlert(message);
  };

  const handleUpdateQuantity = (id, delta) => {
    const updatedInventory = inventory.map(item =>
      item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
    );
    
    const currentItem = inventory.find(item => item.id === id);
    if (currentItem && (currentItem.quantity + delta) < 0) {
        showAlert('Quantity cannot be negative.');
        return;
    }

    // No need to re-sort here as quantity change doesn't affect favorite status
    setInventory(updatedInventory);
    saveInventoryToLocalStorage(updatedInventory);
  };

  // Initiates the deletion confirmation via custom alert
  const handleDeleteItem = (id) => {
    console.log("handleDeleteItem called. ID received for confirmation:", id); // Debug log
    if (!id) {
      console.error("handleDeleteItem: ID is undefined or null, cannot initiate deletion."); // Debug log
      showAlert("Cannot delete item: ID is missing.");
      return;
    }
    setConfirmingDeleteId(id); // Store ID for confirmation
    // Ensure editingItem is valid for displaying name in alert
    const itemToDeleteName = editingItem && editingItem.id === id ? editingItem.name : 'this item';
    showAlert(`Are you sure you want to delete "${itemToDeleteName}"? This action cannot be undone.`);
  };

  // Executes deletion after user confirms via custom alert
  const handleConfirmDeletion = () => {
    const idToDelete = confirmingDeleteId; // Get the ID from state
    console.log("handleConfirmDeletion called. ID to delete:", idToDelete); // Debug log

    if (!idToDelete) {
      console.error("handleConfirmDeletion: No item ID found in confirmingDeleteId state.");
      hideAlert(); // Just hide the alert if no ID is set
      return;
    }

    try {
      const updatedInventory = inventory.filter(item => item.id !== idToDelete);
      // Re-sort after deletion to ensure favorites are at the top
      const favorites = updatedInventory.filter(item => item.isFavorite);
      const nonFavorites = updatedInventory.filter(item => !item.isFavorite);
      const finalInventory = [...favorites, ...nonFavorites];

      setInventory(finalInventory); // Update React state
      saveInventoryToLocalStorage(finalInventory); // Persist to local storage
      
      setEditModalVisible(false); // Close edit modal
      setEditingItem(null); // Clear editing item state
      hideAlert(); // Hide the confirmation alert
      showAlert('Item deleted successfully!');
      console.log("Item deletion process completed successfully for ID:", idToDelete); // Debug log
    } catch (error) {
      console.error("Error during deletion process:", error); // Debug log
      showAlert('Failed to delete item.');
    }
  };

  // Function to toggle favorite status and reorder
  const toggleFavorite = (id) => {
    const updatedItems = inventory.map(item =>
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    );

    // Separate favorites and non-favorites, preserving their relative order
    const favorites = updatedItems.filter(item => item.isFavorite);
    const nonFavorites = updatedItems.filter(item => !item.isFavorite);

    // Recombine to ensure favorites are always at the top
    const newOrder = [...favorites, ...nonFavorites];
    setInventory(newOrder);
    saveInventoryToLocalStorage(newOrder);
  };


  const openEditModal = (item) => {
    console.log("openEditModal called for item:", item); // Debug log
    if (!item || !item.id) {
      console.error("openEditModal: Item or item ID is missing, cannot open modal."); // Debug log
      showAlert("Cannot edit item: Item data is incomplete.");
      return;
    }
    setEditingItem(item); // Set the item being edited
    setEditQuantity(String(item.quantity));
    setEditModalVisible(true);
  };

  const handleSaveEdit = () => {
    if (!editingItem) {
      console.error("handleSaveEdit: No editing item found.");
      return;
    }

    const newQuantity = parseInt(editQuantity, 10);
    if (isNaN(newQuantity) || newQuantity < 0) {
      showAlert('Quantity must be a non-negative number.');
      return;
    }

    const updatedInventory = inventory.map(item =>
      item.id === editingItem.id ? { ...item, quantity: newQuantity } : item
    );
    // No need to re-sort here as quantity change doesn't affect favorite status
    setInventory(updatedInventory);
    saveInventoryToLocalStorage(updatedInventory);

    setEditModalVisible(false);
    setEditingItem(null);
    showAlert('Item updated successfully!');
  };

  // JSON Import/Export Functions (Local Storage Specific)

  const handleImportJson = () => {
    try {
      const parsedData = JSON.parse(jsonImportText);
      if (!Array.isArray(parsedData)) {
        showAlert('Invalid JSON format. Expected an array of items.');
        return;
      }

      const confirmClear = window.confirm('Do you want to clear existing inventory before importing?');
      let finalInventory = [];

      if (!confirmClear) {
        finalInventory = [...inventory];
        parsedData.forEach(newItem => {
            const existingIndex = finalInventory.findIndex(item => item.name.toLowerCase() === newItem.name.toLowerCase());
            if (existingIndex > -1) {
                finalInventory[existingIndex] = {
                    ...finalInventory[existingIndex],
                    quantity: newItem.quantity,
                    isFavorite: newItem.hasOwnProperty('isFavorite') ? newItem.isFavorite : finalInventory[existingIndex].isFavorite, // Preserve or default
                    color: newItem.hasOwnProperty('color') ? newItem.color : finalInventory[existingIndex].color // Preserve or default
                };
            } else {
                finalInventory.push({
                    id: newItem.id || Date.now().toString() + Math.random().toString(36).substring(2, 9),
                    name: newItem.name,
                    quantity: newItem.quantity,
                    isFavorite: newItem.hasOwnProperty('isFavorite') ? newItem.isFavorite : false, // Preserve or default
                    color: newItem.hasOwnProperty('color') ? newItem.color : COLORS[COLORS.length - 1] // Preserve or default
                });
            }
        });

      } else {
        finalInventory = parsedData.map(item => ({
          id: item.id || Date.now().toString() + Math.random().toString(36).substring(2, 9),
          name: item.name,
          quantity: item.quantity,
          isFavorite: item.hasOwnProperty('isFavorite') ? item.isFavorite : false, // Preserve or default
          color: item.hasOwnProperty('color') ? item.color : COLORS[COLORS.length - 1] // Preserve or default
        }));
      }
      
      // Re-sort after import to ensure favorites are at the top
      const favorites = finalInventory.filter(item => item.isFavorite);
      const nonFavorites = finalInventory.filter(item => !item.isFavorite);
      const sortedImportedInventory = [...favorites, ...nonFavorites];

      setInventory(sortedImportedInventory);
      saveInventoryToLocalStorage(sortedImportedInventory);

      setIsImportModalVisible(false);
      setJsonImportText('');
      showAlert('Inventory imported successfully!');

    } catch (error) {
      console.error('Error importing JSON:', error);
      showAlert('Failed to import JSON. Please check the format and ensure it\'s a valid array of objects.');
    }
  };

  const handleExportJson = () => {
    try {
      // Ensure isFavorite and color are included in export
      const jsonString = JSON.stringify(inventory.map(({ id, name, quantity, isFavorite, color }) => ({ name, quantity, isFavorite, color })), null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showAlert('Inventory exported successfully!');
    } catch (error) {
      console.error('Error exporting JSON:', error);
      showAlert('Failed to export JSON.');
    }
  };

  // Handle input change for item name with suggestions
  const handleNewItemNameChange = (e) => {
    const value = e.target.value;
    setNewItemName(value);
    console.log("Input value:", value); // Debug log
    console.log("masterItemNames at time of input:", masterItemNames); // Debug log

    if (value.length > 0) {
      const filteredSuggestions = masterItemNames.filter(name =>
        name.toLowerCase().includes(value.toLowerCase())
      );
      setNameSuggestions(filteredSuggestions);
      setShowNameSuggestions(true);
      console.log("Filtered suggestions:", filteredSuggestions); // Debug log
      console.log("Show suggestions:", true); // Debug log
    } else {
      setNameSuggestions([]);
      setShowNameSuggestions(false);
      console.log("Show suggestions:", false); // Debug log
    }
  };

  // Handle selecting a suggestion
  const handleSelectSuggestion = (suggestion) => {
    setNewItemName(suggestion);
    setNameSuggestions([]);
    setShowNameSuggestions(false);
  };

  // Handle blur event for input to hide suggestions after a short delay
  const handleInputBlur = () => {
    // Delay hiding to allow click on suggestion to register
    setTimeout(() => {
      setShowNameSuggestions(false);
    }, 100);
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e, id) => {
    e.dataTransfer.setData('text/plain', id); // Set data to transfer (the item's ID)
    setDraggedItemId(id); // Store the ID of the item being dragged
    e.currentTarget.classList.add('opacity-50'); // Add visual feedback for dragged item
  };

  const handleDragOver = (e, id) => {
    e.preventDefault(); // Necessary to allow dropping
    if (draggedItemId !== id) {
      setDragOverItemId(id); // Set the ID of the item being dragged over
    }
  };

  const handleDragLeave = (e, id) => {
    if (dragOverItemId === id) {
      setDragOverItemId(null); // Clear drag over visual feedback
    }
    };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');

    // Remove opacity from the dragged item
    const draggedElement = document.querySelector(`[data-item-id="${draggedId}"]`);
    if (draggedElement) {
      draggedElement.classList.remove('opacity-50');
    }
    setDragOverItemId(null); // Clear drag over visual feedback

    if (draggedId === targetId || !draggedId) {
      return; // Dropped on itself or no item being dragged
    }

    const draggedItem = inventory.find(item => item.id === draggedId);
    const targetItem = inventory.find(item => item.id === targetId);

    if (!draggedItem || !targetItem) {
      console.error("Drag or target item not found.");
      return;
    }

    // Enforce rule: Cannot drag an item across favorite/non-favorite sections
    if (draggedItem.isFavorite !== targetItem.isFavorite) {
      showAlert(`Cannot move a ${draggedItem.isFavorite ? 'favorite' : 'non-favorite'} item into the ${targetItem.isFavorite ? 'favorite' : 'non-favorite'} section.`);
      return;
    }

    // If they are in the same favorite status group, then allow reordering
    const newInventory = [...inventory];
    const draggedItemIndex = newInventory.findIndex(item => item.id === draggedId);
    const targetItemIndex = newInventory.findIndex(item => item.id === targetId);

    // Perform the actual reordering
    const [itemToMove] = newInventory.splice(draggedItemIndex, 1);
    newInventory.splice(targetItemIndex, 0, itemToMove);

    setInventory(newInventory);
    saveInventoryToLocalStorage(newInventory);
    setDraggedItemId(null);
  };

  const handleDragEnd = (e) => {
    // This fires after drop or drag is cancelled
    e.currentTarget.classList.remove('opacity-50');
    setDraggedItemId(null);
    setDragOverItemId(null);
  };

  // --- Master List Upload Functions ---
  const handleMasterListUpload = () => {
    const file = masterListFileInputRef.current.files[0];
    if (!file) {
      showAlert('Please select a text file to upload.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const newNames = text.split('\n')
                              .map(name => name.trim())
                              .filter(name => name.length > 0); // Filter out empty lines

        // Merge with existing master names and ensure uniqueness
        const updatedMasterNames = [...new Set([...masterItemNames, ...newNames])];
        setMasterItemNames(updatedMasterNames);
        saveMasterItemsToLocalStorage(updatedMasterNames);

        setIsMasterListModalVisible(false);
        showAlert('Master list uploaded successfully!');
      } catch (error) {
        console.error('Error reading master list file:', error);
        showAlert('Failed to read master list file. Please ensure it is a valid text file.');
      }
    };
    reader.onerror = () => {
      showAlert('Error reading file.');
    };
    reader.readAsText(file);
  };

  // Filtered inventory based on search term
  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sorting logic for table view
  const sortedInventory = React.useMemo(() => {
    let sortableItems = [...filteredInventory]; // Start with filtered items
    if (sortConfig.column !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.column];
        let bValue = b[sortConfig.column];

        // Handle string comparison for 'name'
        if (sortConfig.column === 'name') {
          aValue = String(aValue).toLowerCase();
          bValue = String(bValue).toLowerCase();
          if (aValue < bValue) {
            return sortConfig.direction === 'asc' ? -1 : 1;
          }
          if (aValue > bValue) {
            return sortConfig.direction === 'asc' ? 1 : -1;
          }
          return 0;
        }
        // Handle numeric comparison for 'quantity'
        else if (sortConfig.column === 'quantity') {
          aValue = Number(aValue);
          bValue = Number(bValue);
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        return 0; // No sorting for other columns
      });
    }
    return sortableItems;
  }, [filteredInventory, sortConfig]); // Re-sort whenever filteredInventory or sortConfig changes

  // Handle sort click
  const handleSort = (columnName) => {
    setSortConfig(prevSortConfig => {
      let direction = 'asc';
      if (prevSortConfig.column === columnName && prevSortConfig.direction === 'asc') {
        direction = 'desc';
      } else if (prevSortConfig.column === columnName && prevSortConfig.direction === 'desc') {
        // If already sorted descending, reset sorting
        return { column: null, direction: 'asc' };
      }
      return { column: columnName, direction: direction };
    });
  };

  // Helper to render sort indicator
  const getSortIndicator = (columnName) => {
    if (sortConfig.column === columnName) {
      return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
    }
    return '';
  };


  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
      {/* Tailwind CSS CDN and custom styles are assumed to be in public/index.html */}

      <header className="p-4 bg-white border-b border-gray-200 shadow-sm flex justify-center items-center relative">
        <h1 className="text-2xl font-bold text-gray-900">Family Care Clinic</h1> {/* Updated title */}
      </header>

      <div className="flex-1 p-4 overflow-y-auto pb-24"> {/* Added pb-24 to prevent overlap with bottom bar */}
        {/* Conditional Rendering based on viewMode */}
        {viewMode === 'tiles' ? (
          /* --- TILE VIEW --- */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"> {/* Changed to fixed 4 columns on large screens */}
            {filteredInventory.length === 0 ? (
              <p className="text-center mt-12 text-lg text-gray-500 col-span-full">No items matching your search. Add some using the button below!</p>
            ) : (
              filteredInventory.map(item => (
                <div
                  key={item.id}
                  data-item-id={item.id} // Custom attribute to easily find element during drag
                  className={`rounded-xl p-4 shadow-md flex flex-col justify-between cursor-grab hover:shadow-lg transition duration-200 ease-in-out relative aspect-[3/2]
                    ${draggedItemId === item.id ? 'opacity-50' : ''}
                    ${dragOverItemId === item.id ? 'border-2 border-blue-500' : ''}
                  `}
                  style={{ backgroundColor: item.color }}
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  onDragOver={(e) => handleDragOver(e, item.id)}
                  onDrop={(e) => handleDrop(e, item.id)}
                  onDragLeave={(e) => handleDragLeave(e, item.id)}
                  onDragEnd={handleDragEnd} // Add onDragEnd to reset opacity
                >
                  {/* Star Icon for Favorite */}
                  <button
                    className="absolute top-2 right-2 p-1 rounded-full bg-gray-100 bg-opacity-70 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 z-10"
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
                    aria-label={item.isFavorite ? "Remove from favorites" : "Add to favorites"}
                  >
                    {item.isFavorite ? (
                      <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.783.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.381-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z"></path>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.783.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.381-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z"></path>
                      </svg>
                    )}
                  </button>

                  <div className="flex flex-col flex-grow justify-center" onDoubleClick={() => openEditModal(item)}>
                    <div className="flex flex-col sm:flex-row justify-between items-center sm:items-baseline gap-x-4 mb-1">
                      <p className="text-xl sm:text-2xl font-bold text-indigo-700 text-center sm:text-left flex-1">{item.name}</p>
                      <p className="text-lg sm:text-xl text-indigo-600 text-center sm:text-right">Qty: <span className="font-semibold">{item.quantity}</span></p>
                    </div>
                  </div>

                  <div className="flex w-full mt-auto">
                    <button
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg text-lg shadow-md transition duration-200 ease-in-out"
                      onClick={(e) => { e.stopPropagation(); handleUpdateQuantity(item.id, 1); }}
                    >
                      +
                    </button>
                    <button
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-lg text-lg shadow-md transition duration-200 ease-in-out"
                      onClick={(e) => { e.stopPropagation(); handleUpdateQuantity(item.id, -1); }}
                    >
                      -
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* --- TABLE VIEW --- */
          <div className="overflow-x-auto rounded-xl shadow-md">
            <table className="min-w-full bg-white rounded-xl">
              <thead className="bg-gray-200 border-b border-gray-300">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider rounded-tl-xl">Favorite</th>
                  <th
                    className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-300 transition duration-150 ease-in-out"
                    onClick={() => handleSort('name')}
                  >
                    Item Name {getSortIndicator('name')}
                  </th>
                  <th
                    className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-300 transition duration-150 ease-in-out"
                    onClick={() => handleSort('quantity')}
                  >
                    Quantity {getSortIndicator('quantity')}
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider rounded-tr-xl">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedInventory.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-4 text-gray-500">No items matching your search. Add some using the button below!</td>
                  </tr>
                ) : (
                  // Use 'sortedInventory' for table view
                  sortedInventory.map(item => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition duration-150 ease-in-out"
                      style={{ backgroundColor: item.color }} // Apply dynamic background color to row
                      onDoubleClick={() => openEditModal(item)} // Double-click row to edit
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          className="p-1 rounded-full bg-gray-100 bg-opacity-70 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
                          aria-label={item.isFavorite ? "Remove from favorites" : "Add to favorites"}
                        >
                          {item.isFavorite ? (
                            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.783.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.381-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z"></path>
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.783.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.381-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z"></path>
                            </svg>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-gray-900 font-medium">{item.name}</td>
                      <td className="py-3 px-4 text-gray-700">{item.quantity}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 rounded-lg text-sm shadow-md transition duration-200 ease-in-out"
                            onClick={(e) => { e.stopPropagation(); handleUpdateQuantity(item.id, 1); }}
                          >
                            +
                          </button>
                          <button
                            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 rounded-lg text-sm shadow-md transition duration-200 ease-in-out"
                            onClick={(e) => { e.stopPropagation(); handleUpdateQuantity(item.id, -1); }}
                          >
                            -
                          </button>
                          <button
                            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-3 rounded-lg text-sm shadow-md transition duration-200 ease-in-out"
                            onClick={(e) => { e.stopPropagation(); openEditModal(item); }}
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Fixed bottom action bar */}
      <div className="fixed bottom-6 left-6 right-6 flex flex-col sm:flex-row gap-3 p-4 bg-white rounded-xl shadow-lg z-10 justify-center items-center">
        {/* Add New Item Button */}
        <button
          className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white text-base font-bold py-2 px-4 rounded-xl shadow-md transition duration-200 ease-in-out"
          onClick={() => setAddModalVisible(true)}
        >
          Add New Item
        </button>

        {/* Search Bar */}
        <div className="w-full sm:flex-1 mt-3 sm:mt-0">
          <input
            type="text"
            placeholder="Search items..."
            className="w-full p-2 border border-gray-300 rounded-lg text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* View Mode and JSON Icons */}
        <div className="flex gap-2 mt-3 sm:mt-0">
          {/* Tile View Icon Button */}
          <button
            className={`p-3 rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition duration-200 ease-in-out ${
              viewMode === 'tiles' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setViewMode('tiles')}
            aria-label="Switch to Tile View"
          >
            {/* Grid Icon for Tile View */}
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
            </svg>
          </button>
          {/* Table View Icon Button */}
          <button
            className={`p-3 rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition duration-200 ease-in-out ${
              viewMode === 'table' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setViewMode('table')}
            aria-label="Switch to Table View"
          >
            {/* List/Table Icon for Table View */}
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>
            </svg>
          </button>
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition duration-200 ease-in-out"
            onClick={() => setIsImportModalVisible(true)}
            aria-label="Load JSON"
          >
            {/* Upload/Import Icon */}
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
            </svg>
          </button>
          {/* New: Upload Master List Button */}
          <button
            className="bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition duration-200 ease-in-out"
            onClick={() => setIsMasterListModalVisible(true)}
            aria-label="Upload Master List"
          >
            {/* Document Upload Icon */}
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </button>
          <button
            className="bg-purple-500 hover:bg-purple-600 text-white p-3 rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition duration-200 ease-in-out"
            onClick={handleExportJson}
            aria-label="Share JSON"
          >
            {/* Share Icon */}
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.882 13.07 9.283 13 9.683 13h4.634c.4 0 .799.07 1.098.342l3.682 2.658c.315.227.34.67.054.912l-1.429 1.258c-.31.272-.75.246-1.034-.06L14 16l-3.292 3.292a1 1 0 01-1.414 0l-1.414-1.414a1 1 0 010-1.414L8.684 13.342z"></path>
            </svg>
          </button>
        </div>
      </div>


      {/* Add New Item Modal */}
      {isAddModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-20 p-4">
          <div className="bg-white rounded-2xl p-8 shadow-xl w-full max-w-md">
            <h2 className="2xl font-bold mb-6 text-gray-900 text-center">Add New Inventory Item</h2>
            <div className="relative mb-4"> {/* Added relative for positioning suggestions */}
              <input
                ref={nameInputRef}
                className="w-full p-3 border border-gray-300 rounded-lg text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Item Name"
                value={newItemName}
                onChange={handleNewItemNameChange}
                onFocus={() => setShowNameSuggestions(true)}
                onBlur={handleInputBlur}
              />
              {showNameSuggestions && nameSuggestions.length > 0 && (
                <ul className="absolute z-30 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                  {nameSuggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      className="p-3 cursor-pointer hover:bg-gray-100 text-gray-800"
                      onMouseDown={(e) => { // Use onMouseDown to prevent blur from hiding before click
                        e.preventDefault(); // Prevent input blur
                        handleSelectSuggestion(suggestion);
                      }}
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <input
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Quantity"
              type="number"
              value={newItemQuantity}
              onChange={(e) => setNewItemQuantity(e.target.value)}
            />
            <div className="mb-6">
              <label htmlFor="itemColor" className="text-gray-700 text-base mb-2 block">Choose Tile Color:</label>
              <div className="grid grid-cols-6 gap-2"> {/* Grid for color palette, now 6 columns */}
                {COLORS.map((colorOption) => (
                  <button
                    key={colorOption}
                    className={`w-8 h-8 rounded-lg cursor-pointer border-2 ${ // Smaller size
                      newItemColor === colorOption ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-300'
                    } transition duration-150 ease-in-out`}
                    style={{ backgroundColor: colorOption }}
                    onClick={() => setNewItemColor(colorOption)}
                    aria-label={`Select color ${colorOption}`}
                  ></button>
                ))}
              </div>
            </div>
            <div className="flex justify-around gap-4">
              <button
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 rounded-xl shadow-md transition duration-200 ease-in-out"
                onClick={() => setAddModalVisible(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl shadow-md transition duration-200 ease-in-out"
                onClick={handleAddItem}
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {isEditModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-20 p-4">
          <div className="bg-white rounded-2xl p-8 shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 text-center">Edit Item Quantity</h2>
            {editingItem && (
              <p className="text-lg mb-4 text-gray-700 text-center">Item: <span className="font-semibold">{editingItem.name}</span></p>
            )}
            <input
              className="w-full p-3 border border-gray-300 rounded-lg mb-6 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="New Quantity"
              type="number"
              value={editQuantity}
              onChange={(e) => setEditQuantity(e.target.value)}
            />
            <div className="flex justify-around gap-4 mt-6">
              <button
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 rounded-xl shadow-md transition duration-200 ease-in-out"
                onClick={() => setEditModalVisible(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl shadow-md transition duration-200 ease-in-out"
                onClick={handleSaveEdit}
              >
                Save Changes
              </button>
            </div>
            <button
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl shadow-md transition duration-200 ease-in-out mt-4"
              onClick={() => handleDeleteItem(editingItem.id)}
            >
              Delete Item
            </button>
          </div>
        </div>
      )}

      {/* Import JSON Modal */}
      {isImportModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-20 p-4">
          <div className="bg-white rounded-2xl p-8 shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 text-center">Import Inventory from JSON</h2>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg mb-6 text-base text-gray-900 h-40 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Paste JSON array here, e.g., [{&quot;name&quot;:&quot;Item A&quot;,&quot;quantity&quot;:10, &quot;isFavorite&quot;:true, &quot;color&quot;:&quot;#abcdef&quot;}]"
              value={jsonImportText}
              onChange={(e) => setJsonImportText(e.target.value)}
            ></textarea>
            <div className="flex justify-around gap-4">
              <button
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 rounded-xl shadow-md transition duration-200 ease-in-out"
                onClick={() => setIsImportModalVisible(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl shadow-md transition duration-200 ease-in-out"
                onClick={handleImportJson}
              >
                Import Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Master List Upload Modal */}
      {isMasterListModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-20 p-4">
          <div className="bg-white rounded-2xl p-8 shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 text-center">Upload Item Master List</h2>
            <p className="text-gray-700 mb-4 text-center">Please upload a text file (.txt) with one item name per line.</p>
            <input
              type="file"
              accept=".txt"
              ref={masterListFileInputRef}
              className="w-full p-3 border border-gray-300 rounded-lg mb-6 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-around gap-4">
              <button
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 rounded-xl shadow-md transition duration-200 ease-in-out"
                onClick={() => setIsMasterListModalVisible(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-md transition duration-200 ease-in-out"
                onClick={handleMasterListUpload}
              >
                Upload List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Modal - Now also used for Delete Confirmation */}
      {isAlertVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-30 p-4">
          <div className="bg-white rounded-2xl p-8 shadow-xl w-full max-w-sm text-center">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Notification</h3>
            <p className="text-gray-700 mb-6">{alertMessage}</p>
            {confirmingDeleteId ? (
              <div className="flex justify-around gap-4">
                <button
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 rounded-xl shadow-md transition duration-200 ease-in-out"
                  onClick={hideAlert}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl shadow-md transition duration-200 ease-in-out"
                  onClick={handleConfirmDeletion}
                >
                  Delete
                </button>
              </div>
            ) : (
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-md transition duration-200 ease-in-out"
                onClick={hideAlert}
              >
                OK
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
