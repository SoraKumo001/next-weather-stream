import {
  createContext,
  MutableRefObject,
  ReactNode,
  Suspense,
  SuspenseProps,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type PropeatyType<T> = {
  value?: T;
  isInit?: boolean;
  isSuspenseLoad?: boolean;
};
export type SuspenseDispatch = () => void;
const isServer = typeof window === "undefined";
const cacheMap: { [key: string]: unknown } = {};
const SuspenseContext = createContext<unknown>(undefined);
export const useSuspense = <T,>() => useContext(SuspenseContext) as T;

const SuspenseWapper = <T,>({
  property,
  idName,
  children,
  load,
}: {
  property: PropeatyType<T>;
  idName: string;
  children: ReactNode;
  load: () => Promise<unknown>;
}) => {
  if (!property.isInit) throw load();
  const [isRequestData, setRequestData] = useState(
    property.isSuspenseLoad || isServer
  );
  useEffect(() => setRequestData(false), []);
  return (
    <SuspenseContext.Provider value={property.value}>
      {isRequestData && (
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
  if (!isServer && !property.isInit) {
    const value = cacheMap[name];
    if (value) {
      property.value = value as T;
      property.isInit = true;
      property.isSuspenseLoad = false;
    }
  }
  const load = useCallback(() => {
    return new Promise<T>((resolve) => {
      if (!isServer) {
        const node = document.getElementById(idName);
        if (node) {
          property.isSuspenseLoad = true;
          resolve(JSON.parse(node.innerHTML).value);
          return;
        }
      }
      loader(loaderValue as V).then((v) => {
        property.isSuspenseLoad = false;
        resolve(v);
      });
    }).then((value) => {
      property.isInit = true;
      property.value = value;
      cacheMap[name] = value;
      onLoaded?.(value);
    });
  }, [loader, onLoaded]);
  if (dispatch) {
    dispatch.current = () => {
      property.value = undefined;
      property.isInit = false;
      delete cacheMap[name];
      reload({});
    };
  }
  return (
    <Suspense fallback={fallback || false}>
      <SuspenseWapper<T> idName={idName} property={property} load={load}>
        {children}
      </SuspenseWapper>
    </Suspense>
  );
};
