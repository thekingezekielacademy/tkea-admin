# Hydration Mismatch Prevention Checklist

## 🚨 **Critical Rules to Follow**

### **1. Never Use Non-Deterministic Values During SSR**
❌ **DON'T DO THIS:**
```tsx
// These will cause hydration mismatches
const randomId = Math.random().toString(36);
const currentTime = Date.now();
const userAgent = navigator.userAgent;
const windowWidth = window.innerWidth;
```

✅ **DO THIS INSTEAD:**
```tsx
// Use HydrationSafeValue for dynamic values
<HydrationSafeValue fallback={<div>Loading...</div>}>
  <div>{new Date().toLocaleString()}</div>
</HydrationSafeValue>

// Or use useEffect for client-only values
const [randomId, setRandomId] = useState('');
useEffect(() => {
  setRandomId(Math.random().toString(36));
}, []);
```

### **2. Handle Authentication State Properly**
❌ **DON'T DO THIS:**
```tsx
// This causes hydration mismatch - server renders null, client renders user
{user && <UserProfile />}
```

✅ **DO THIS INSTEAD:**
```tsx
// Use HydrationSafeValue to prevent mismatches
<HydrationSafeValue fallback={<div>Loading...</div>}>
  {user && <UserProfile />}
</HydrationSafeValue>

// Or use consistent initial state
const [isHydrated, setIsHydrated] = useState(false);
useEffect(() => setIsHydrated(true), []);
return isHydrated ? (user && <UserProfile />) : <div>Loading...</div>;
```

### **3. Avoid Browser APIs During Initial Render**
❌ **DON'T DO THIS:**
```tsx
// These will cause hydration mismatches
const isClient = typeof window !== 'undefined';
const localStorage = window.localStorage.getItem('key');
const screenWidth = window.innerWidth;
```

✅ **DO THIS INSTEAD:**
```tsx
// Use HydrationSafeValue or useEffect
<HydrationSafeValue fallback={<div>Loading...</div>}>
  <div>{window.innerWidth}</div>
</HydrationSafeValue>

// Or use custom hooks
const useSafeStorage = (key: string) => {
  const [value, setValue] = useState(null);
  useEffect(() => {
    setValue(localStorage.getItem(key));
  }, [key]);
  return value;
};
```

### **4. Handle Date/Time Values Safely**
❌ **DON'T DO THIS:**
```tsx
// Server and client will have different times
<div>Last updated: {new Date().toLocaleString()}</div>
```

✅ **DO THIS INSTEAD:**
```tsx
// Use HydrationSafeValue or pass date as prop
<HydrationSafeValue fallback={<div>Loading...</div>}>
  <div>Last updated: {new Date().toLocaleString()}</div>
</HydrationSafeValue>

// Or pass date from server
<div>Last updated: {lastUpdated}</div>
```

### **5. Use suppressHydrationWarning Sparingly**
❌ **DON'T DO THIS:**
```tsx
// Overusing suppressHydrationWarning masks real issues
<div suppressHydrationWarning>
  {user && <UserProfile />}
</div>
```

✅ **DO THIS INSTEAD:**
```tsx
// Only use for harmless mismatches (like browser extensions)
<div suppressHydrationWarning>
  {/* Only for extension attributes like bis_skin_checked */}
</div>

// For auth state, use proper hydration handling
<HydrationSafeValue fallback={<div>Loading...</div>}>
  {user && <UserProfile />}
</HydrationSafeValue>
```

## 🔧 **Best Practices**

### **1. Use HydrationSafeValue Component**
```tsx
import { HydrationSafeValue } from '@/components/HydrationSafeValue';

// For dynamic content
<HydrationSafeValue fallback={<div>Loading...</div>}>
  <div>{dynamicValue}</div>
</HydrationSafeValue>

// For authentication
<HydrationSafeValue fallback={<div>Loading...</div>}>
  {user && <UserProfile />}
</HydrationSafeValue>
```

### **2. Use Custom Hooks for Safe Values**
```tsx
import { useHydrationSafeValue, useSafeStorage } from '@/components/HydrationSafeValue';

// For client-only values
const dynamicValue = useHydrationSafeValue(getValue(), null);

// For localStorage
const [storedValue, setStoredValue] = useSafeStorage('key', null);
```

### **3. Consistent Initial State**
```tsx
// Always initialize with consistent server/client state
const [user, setUser] = useState(null); // Not undefined
const [loading, setLoading] = useState(true); // Not false
const [isHydrated, setIsHydrated] = useState(false);

useEffect(() => {
  setIsHydrated(true);
  // Now safe to use client-only APIs
}, []);
```

### **4. Test for Hydration Mismatches**
```tsx
// Add this to your components during development
useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Component hydrated successfully');
  }
}, []);
```

## 🚫 **Common Anti-Patterns to Avoid**

### **1. Conditional Rendering Based on Client State**
```tsx
// ❌ BAD - causes hydration mismatch
{typeof window !== 'undefined' && <ClientOnlyComponent />}

// ✅ GOOD - use HydrationSafeValue
<HydrationSafeValue fallback={null}>
  <ClientOnlyComponent />
</HydrationSafeValue>
```

### **2. Direct Browser API Access**
```tsx
// ❌ BAD - causes hydration mismatch
const userAgent = navigator.userAgent;

// ✅ GOOD - use useEffect
const [userAgent, setUserAgent] = useState('');
useEffect(() => {
  setUserAgent(navigator.userAgent);
}, []);
```

### **3. Random Values in Render**
```tsx
// ❌ BAD - causes hydration mismatch
<div>ID: {Math.random().toString(36)}</div>

// ✅ GOOD - use useEffect or deterministic values
const [id, setId] = useState('');
useEffect(() => {
  setId(Math.random().toString(36));
}, []);
```

## 🧪 **Testing for Hydration Issues**

### **1. Check Browser Console**
Look for warnings like:
- "A tree hydrated but some attributes of the server rendered HTML didn't match the client properties"
- "Text content did not match"
- "Hydration failed because the initial UI does not match"

### **2. Use React DevTools**
- Check for hydration warnings in the console
- Look for components that re-render after hydration

### **3. Test with Different Browsers**
- Test in incognito mode (no extensions)
- Test with extensions disabled
- Test on mobile devices

## 📝 **Quick Reference**

### **Safe Patterns:**
- ✅ Static content
- ✅ Props passed from server
- ✅ Consistent initial state
- ✅ HydrationSafeValue wrapper
- ✅ useEffect for client-only code

### **Dangerous Patterns:**
- ❌ Math.random() in render
- ❌ Date.now() in render
- ❌ navigator.* in render
- ❌ window.* in render
- ❌ localStorage in render
- ❌ Conditional rendering based on client state

### **When to Use suppressHydrationWarning:**
- ✅ Browser extension attributes (bis_skin_checked, etc.)
- ✅ Third-party scripts that modify DOM
- ✅ Harmless visual differences
- ❌ Authentication state
- ❌ User-specific content
- ❌ Dynamic values

## 🔍 **Debugging Tips**

1. **Add logging to identify mismatches:**
```tsx
useEffect(() => {
  console.log('Component hydrated:', { user, loading });
}, [user, loading]);
```

2. **Use React DevTools Profiler** to see re-renders

3. **Check network tab** for hydration warnings

4. **Test with different user states** (logged in/out)

Remember: **Prevention is better than fixing hydration mismatches after they occur!**
