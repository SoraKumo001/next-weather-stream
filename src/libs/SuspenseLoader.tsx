import {
  createContext,
  MutableRefObject,
  ReactNode,
  Suspense,
  SuspenseProps,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type PropeatyType<T> = {
  promise?: Promise<T>;
  value?: T;
  init?: boolean;
};
export type SuspenseDispatch = () => void;
const isServer = typeof window === "undefined";

const SuspenseContext = createContext<unknown>(undefined);
export const useSuspense = <T,>() => useContext(SuspenseContext) as T;
const SuspenseWapper = <T,>({
  property,
  idName,
  children,
}: {
  property: PropeatyType<T>;
  idName: string;
  children: ReactNode;
}) => {
  if (!property.init) throw property.promise;
  const [isRequestValue, setRequestValue] = useState(true);
  useEffect(() => {
    setRequestValue(false);
  }, []);
  return (
    <SuspenseContext.Provider value={property.value}>
      {isRequestValue && (
        <script
          id={idName}
          type="application/json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({ value: property.value }),
          }}
        />
      )}
      {children}
    </SuspenseContext.Provider>
  );
};
const cacheMap: { [key: string]: unknown } = {};

export const SuspenseLoader = <T, V>({
  name,
  loader,
  loaderValue,
  fallback,
  onLoaded,
  children,
  dispatch,
}: {
  name: string;
  loader: (value: V) => Promise<T>;
  loaderValue?: V;
  fallback?: SuspenseProps["fallback"];
  onLoaded?: (value: T) => void;
  children: ReactNode;
  dispatch?: MutableRefObject<SuspenseDispatch | undefined>;
}) => {
  const [_, reload] = useState({});
  const idName = "#__NEXT_DATA__STREAM__" + name;
  const property = useRef<PropeatyType<T>>({}).current;
  if (!isServer && !property.init) {
    const cache = cacheMap[name];
    if (cache) {
      property.value = cache as T;
      property.init = true;
    } else {
      const node = document.getElementById(idName);
      if (node) {
        property.value = JSON.parse(node.innerHTML).value;
        property.init = true;
        cacheMap[name] = property.value;
      }
    }
  }
  if (!property.init && !property.promise) {
    property.promise = loader(loaderValue as V).then((v) => {
      property.value = v;
      property.init = true;
      cacheMap[name] = property.value;
      return v;
    });
  }
  useEffect(() => {
    onLoaded?.(property.value as T);
  }, []);
  if (dispatch) {
    dispatch.current = () => {
      property.promise = undefined;
      property.value = undefined;
      property.init = false;
      delete cacheMap[name];
      reload({});
    };
  }
  return (
    <Suspense fallback={fallback || false}>
      <SuspenseWapper<T> idName={idName} property={property}>
        {children}
      </SuspenseWapper>
    </Suspense>
  );
};
