export function findNearestTextNodeWithMinLength(startNode, minLength = 100) {
    // Helper: checks if a node is a valid long-enough text node
    function isValidTextNode(node) {
      return node.nodeType === Node.TEXT_NODE && node.nodeValue.trim().length > minLength;
    }
  
    // Step 1: Forward search using next nodes
    let forwardNode = startNode;
    while (forwardNode) {
      if (isValidTextNode(forwardNode)) return forwardNode;
      forwardNode = nextNode(forwardNode);
    }
  
    // Step 2: Backward search using previous nodes
    let backwardNode = startNode;
    while (backwardNode) {
      if (isValidTextNode(backwardNode)) return backwardNode;
      backwardNode = previousNode(backwardNode);
    }
  
    return null; // Not found
  }
  
  // DOM walker to go to next node in document order
  function nextNode(node) {
    if (node.firstChild) return node.firstChild;
    while (node) {
      if (node.nextSibling) return node.nextSibling;
      node = node.parentNode;
    }
    return null;
  }
  
  // DOM walker to go to previous node in document order
  function previousNode(node) {
    if (node.previousSibling) {
      node = node.previousSibling;
      while (node.lastChild) node = node.lastChild;
      return node;
    }
    return node.parentNode;
  }
  