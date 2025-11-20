<script>
  import { writable } from 'svelte/store';
  import { browser } from '$app/environment';

  // Font size store - reactive across the app
  export const fontSizeStore = writable('medium');

  // Font size options
  const fontSizes = {
    'xs': { label: 'XS', scale: 0.75, description: 'Extra Small' },
    'small': { label: 'S', scale: 0.875, description: 'Small' },
    'medium': { label: 'M', scale: 1, description: 'Medium' },
    'large': { label: 'L', scale: 1.125, description: 'Large' },
    'xl': { label: 'XL', scale: 1.25, description: 'Extra Large' },
    'xxl': { label: 'XXL', scale: 1.375, description: 'Extra Extra Large' }
  };

  const sizeKeys = Object.keys(fontSizes);
  let currentSize = 'medium';
  let showDropdown = false;

  // Initialize from localStorage if available
  if (browser) {
    const savedSize = localStorage.getItem('fontSize') || 'medium';
    if (fontSizes[savedSize]) {
      currentSize = savedSize;
      fontSizeStore.set(currentSize);
      applyFontSize(currentSize);
    }
  }

  // Subscribe to store changes
  fontSizeStore.subscribe(size => {
    currentSize = size;
    if (browser) {
      applyFontSize(size);
      localStorage.setItem('fontSize', size);
    }
  });

  function applyFontSize(size) {
    if (!browser) return;
    
    const scale = fontSizes[size]?.scale || 1;
    document.documentElement.style.setProperty('--font-scale', scale.toString());
    document.documentElement.setAttribute('data-font-size', size);
  }

  function changeFontSize(newSize) {
    if (fontSizes[newSize]) {
      fontSizeStore.set(newSize);
      showDropdown = false;
    }
  }

  function increaseFontSize() {
    const currentIndex = sizeKeys.indexOf(currentSize);
    if (currentIndex < sizeKeys.length - 1) {
      changeFontSize(sizeKeys[currentIndex + 1]);
    }
  }

  function decreaseFontSize() {
    const currentIndex = sizeKeys.indexOf(currentSize);
    if (currentIndex > 0) {
      changeFontSize(sizeKeys[currentIndex - 1]);
    }
  }

  function toggleDropdown() {
    showDropdown = !showDropdown;
  }

  // Close dropdown when clicking outside
  function handleClickOutside(event) {
    if (!event.target.closest('.font-size-control')) {
      showDropdown = false;
    }
  }

  // Keyboard shortcuts
  function handleKeydown(event) {
    if (event.ctrlKey || event.metaKey) {
      if (event.key === '=' || event.key === '+') {
        event.preventDefault();
        increaseFontSize();
      } else if (event.key === '-') {
        event.preventDefault();
        decreaseFontSize();
      } else if (event.key === '0') {
        event.preventDefault();
        changeFontSize('medium');
      }
    }
  }

  // Add global event listeners
  if (browser) {
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeydown);
  }
</script>

<div class="font-size-control">
  <!-- Compact Toggle Button -->
  <button
    on:click={toggleDropdown}
    class="control-trigger"
    title="Font Size Controls (Ctrl/Cmd + / - / 0)"
    aria-label="Font size control"
  >
    <svg class="magnifier-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
    <span class="size-label">{fontSizes[currentSize].label}</span>
    <svg class="dropdown-icon {showDropdown ? 'rotated' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
    </svg>
  </button>

  <!-- Dropdown Panel -->
  {#if showDropdown}
    <div class="control-panel">
      <!-- Quick Controls -->
      <div class="quick-controls">
        <button
          on:click={decreaseFontSize}
          disabled={currentSize === sizeKeys[0]}
          class="quick-btn decrease"
          title="Decrease font size (Ctrl/Cmd + -)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
          </svg>
        </button>

        <div class="current-size">
          <span class="size-display">{fontSizes[currentSize].label}</span>
          <span class="size-description">{fontSizes[currentSize].description}</span>
        </div>

        <button
          on:click={increaseFontSize}
          disabled={currentSize === sizeKeys[sizeKeys.length - 1]}
          class="quick-btn increase"
          title="Increase font size (Ctrl/Cmd + +)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      <!-- Size Options -->
      <div class="size-options">
        {#each sizeKeys as sizeKey}
          <button
            on:click={() => changeFontSize(sizeKey)}
            class="size-option {currentSize === sizeKey ? 'active' : ''}"
            style="font-size: {fontSizes[sizeKey].scale}em"
          >
            <span class="option-label">{fontSizes[sizeKey].label}</span>
            <span class="option-text">Sample Text</span>
            {#if sizeKey === 'medium'}
              <span class="default-badge">Default</span>
            {/if}
          </button>
        {/each}
      </div>

      <!-- Reset Button -->
      <div class="control-footer">
        <button
          on:click={() => changeFontSize('medium')}
          class="reset-btn"
          title="Reset to default size (Ctrl/Cmd + 0)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reset to Default
        </button>
        
        <div class="keyboard-hint">
          <kbd>Ctrl</kbd> + <kbd>+/-/0</kbd>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .font-size-control {
    position: relative;
    z-index: 1000;
  }

  .control-trigger {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.875rem;
    font-weight: 500;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .control-trigger:hover {
    border-color: #cbd5e1;
    background: #f8fafc;
    color: #374151;
  }

  .magnifier-icon {
    width: 1rem;
    height: 1rem;
  }

  .size-label {
    font-weight: 600;
    color: #3b82f6;
  }

  .dropdown-icon {
    width: 0.875rem;
    height: 0.875rem;
    transition: transform 0.2s ease;
  }

  .dropdown-icon.rotated {
    transform: rotate(180deg);
  }

  .control-panel {
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0;
    min-width: 280px;
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    padding: 1rem;
    z-index: 50;
  }

  .quick-controls {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .quick-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .quick-btn:hover:not(:disabled) {
    background: #3b82f6;
    border-color: #3b82f6;
    color: white;
  }

  .quick-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .current-size {
    flex: 1;
    text-align: center;
  }

  .size-display {
    display: block;
    font-size: 1.125rem;
    font-weight: 600;
    color: #1e293b;
  }

  .size-description {
    display: block;
    font-size: 0.75rem;
    color: #64748b;
    margin-top: 0.125rem;
  }

  .size-options {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .size-option {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    position: relative;
  }

  .size-option:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  .size-option.active {
    background: #dbeafe;
    border-color: #3b82f6;
    color: #1d4ed8;
  }

  .option-label {
    font-weight: 600;
    min-width: 2rem;
    color: #3b82f6;
  }

  .option-text {
    flex: 1;
    color: #1e293b;
  }

  .default-badge {
    font-size: 0.625rem;
    padding: 0.125rem 0.375rem;
    background: #059669;
    color: white;
    border-radius: 4px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  .control-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 1rem;
    border-top: 1px solid #e2e8f0;
  }

  .reset-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.875rem;
  }

  .reset-btn:hover {
    background: #e2e8f0;
    color: #374151;
  }

  .keyboard-hint {
    font-size: 0.75rem;
    color: #94a3b8;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .keyboard-hint kbd {
    padding: 0.125rem 0.25rem;
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    border-radius: 3px;
    font-family: ui-monospace, SFMono-Regular, monospace;
    font-size: 0.625rem;
  }

  /* Responsive adjustments */
  @media (max-width: 640px) {
    .control-panel {
      right: -1rem;
      left: -1rem;
      width: auto;
      min-width: auto;
    }
  }
</style>