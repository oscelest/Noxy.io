enum KeyboardCommand {
  NEXT_FOCUS           = "Tab",
  PREV_FOCUS           = "Shift+Tab",
  
  INDENT               = "Shift+Alt+ArrowRight",
  OUTDENT              = "Shift+Alt+ArrowLeft",
  
  ARROW_DOWN           = "ArrowDown",
  ARROW_UP             = "ArrowUp",
  
  UNDO                 = "Ctrl+KeyZ",
  UNDO_ALT             = "Ctrl+Shift+KeyY",
  REDO                 = "Ctrl+KeyY",
  REDO_ALT             = "Ctrl+Shift+KeyZ",
  
  NEW_LINE             = "Enter",
  NEW_LINE_ALT         = "NumpadEnter",
  NEW_PARAGRAPH        = "Shift+Enter",
  NEW_PARAGRAPH_ALT    = "Shift+NumpadEnter",
  
  SELECT_ALL           = "Ctrl+KeyA",
  
  CUT                  = "Ctrl+KeyX",
  COPY                 = "Ctrl+KeyC",
  PASTE                = "Ctrl+KeyV",
  PASTE_RAW            = "Ctrl+Shift+KeyV",
  PASTE_RAW_ALT        = "Ctrl+ALT+KeyV",
  
  SKIP_WORD_LEFT       = "Ctrl+ArrowLeft",
  SKIP_WORD_RIGHT      = "Ctrl+ArrowRight",
  SKIP_START           = "Ctrl+ArrowUp",
  SKIP_END             = "Ctrl+ArrowDown",
  
  DELETE_FORWARD       = "Delete",
  DELETE_BACKWARD      = "Backspace",
  
  DELETE_WORD_FORWARD  = "Ctrl+Delete",
  DELETE_WORD_BACKWARD = "Ctrl+Backspace",
  
  BOLD_TEXT            = "Ctrl+KeyB",
  ITALIC_TEXT          = "Ctrl+KeyI",
  UNDERLINE_TEXT       = "Ctrl+KeyU",
  MARK_TEXT            = "Ctrl+KeyH",
  STRIKETHROUGH_TEXT   = "Ctrl+KeyD",
  CODE_TEXT            = "Ctrl+KeyM",
}

export default KeyboardCommand;
