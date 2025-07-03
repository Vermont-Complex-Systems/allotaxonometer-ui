export { matlab_sort, rin, rank_maxlog10, tiedrank, which, zeros, getUnions, setdiff } ;

// Takes arrays, returns a Set object containing the union of both arrays
 function getUnions(x,y) {
  let a = new Set(x); // convert array x to a Set object
  let b = new Set(y); // convert array y to a Set object
  return new Set([...a, ...b]); // return a new Set object containing the union of a and b
}

// Takes arrays, returns a Set object
function setdiff(x,y) {
  let a = new Set(x); // convert array x to a Set object
  let b = new Set(y); // convert array y to a Set object
  // return a new Set object containing elements in a that are not present in b
  return new Set(       
    [...a].filter(x => !b.has(x)));
} 

function which(x) {
  // Which indices are TRUE?
  // Description:
  //   Give the ‘TRUE’ indices of a logical object, allowing for array indices.
  // Arguments:
  //   x: a ‘logical’ vector or array.
  return x.reduce(
      (out, bool, index) => bool ? out.concat(index) : out, 
      []
    )
}


function matlab_sort(A, rev = false) {
    if (A.length === 0) return { value: [], orig_idx: [] };
    if (A.length === 1) return { value: [...A], orig_idx: [0] };
    
    // Create array of [value, originalIndex] pairs
    const indexedArray = A.map((value, index) => ({ value, index }));
    
    // Sort by value (ascending or descending)
    if (rev) {
        indexedArray.sort((a, b) => b.value - a.value);
    } else {
        indexedArray.sort((a, b) => a.value - b.value);
    }
    
    // Extract sorted values and original indices
    const value = indexedArray.map(item => item.value);
    const orig_idx = indexedArray.map(item => item.index);
    
    return { value, orig_idx };
}

function tiedrank(arr) {
    if (arr.length === 0) return [];
    
    // Group values by their actual value
    const valueMap = new Map();
    arr.forEach((value, index) => {
        if (!valueMap.has(value)) {
            valueMap.set(value, []);
        }
        valueMap.get(value).push(index);
    });
    
    // Sort values in descending order (to match original behavior)
    const sortedValues = [...valueMap.keys()].sort((a, b) => b - a);
    
    // Calculate ranks
    const ranks = new Array(arr.length);
    let currentRank = 1;
    
    for (const value of sortedValues) {
        const indices = valueMap.get(value);
        const tieCount = indices.length;
        
        // Calculate average rank for tied values
        const avgRank = currentRank + (tieCount - 1) / 2;
        
        // Assign the average rank to all tied indices
        indices.forEach(index => {
            ranks[index] = avgRank;
        });
        
        currentRank += tieCount;
    }
    
    return ranks;
}

function rank_maxlog10(mixedelements) {
  // Get maximum of log10 ranks from both systems, then round up
  let logged_max = [
    Math.max(...mixedelements[[0]].ranks), Math.max(...mixedelements[[1]].ranks)
  ].map(Math.log10)
  return Math.ceil(Math.max(...[logged_max[0], logged_max[1]]))
}

function rin(arr1, arr2) {
  // Find element arr1 presents in arr2, i.e. arr1 %in% arr2
  //
  // examples
  // A = ["bob", "george", "jesus"]
  // B = ["bob", "jesus", "terrence"]
  // rin(A, B)
  // [true, false, true]
  return Array.from(arr1, (x) => {
    return arr2.indexOf(x) == -1 ? false : true
  })
}

function zeros(length){
  // Create array of all zeros. Similar to matlab.
  function createArray(length) {
    var arr = new Array(length || 0),
        i = length;
    if (arguments.length > 1) {
        var args = Array.prototype.slice.call(arguments, 1);
        while(i--) arr[length-1 - i] = createArray.apply(this, args);
    }
    return arr;
  }
  let empty_mat = createArray(length,length)
  return Array.from(empty_mat, arr => arr.fill(0))
}