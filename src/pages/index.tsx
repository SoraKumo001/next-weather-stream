import React, { Ref, RefObject, useRef } from "react";
import Link from "next/link";
import {
  SuspenseDispatch,
  SuspenseLoader,
  useSuspense,
} from "../libs/SuspenseLoader";

interface Center {
  name: string;
  enName: string;
  officeName?: string;
  children?: string[];
  parent?: string;
  kana?: string;
}
interface Centers {
  [key: string]: Center;
}
interface Area {
  centers: Centers;
  offices: Centers;
  class10s: Centers;
  class15s: Centers;
  class20s: Centers;
}

const AreaList = () => {
  const area = useSuspense<Area | undefined>();
  if (!area) return <>読み込みに失敗しました</>;
  return (
    <div>
      {Object.entries(area.offices).map(([code, { name }]) => (
        <div key={code}>
          <Link href={`/weather/?id=${code}`}>{name}</Link>
        </div>
      ))}
    </div>
  );
};

const Page = () => {
  const dispatch = useRef<SuspenseDispatch>();
  const loader = () =>
    fetch(`https://www.jma.go.jp/bosai/common/const/area.json`)
      .then((r) => r.json())
      //1秒の遅延を仕込む
      .then(async (v) => (await new Promise((r) => setTimeout(r, 1000))) || v)
      .catch(() => undefined);
  return (
    <>
      <button onClick={() => dispatch.current()}>Reload</button>
      <SuspenseLoader
        dispatch={dispatch} //リロード用dispatch
        name="Weather/130000" //SSR引き継ぎデータに名前を付ける
        loader={loader} //Promiseを返すローダー
        fallback={<div>読み込み中</div>} //読み込み中に表示しておくコンポーネント
        onLoaded={() => console.log("読み込み完了")} //読み込み完了後に発生するイベント
      >
        <AreaList />
      </SuspenseLoader>
    </>
  );
};
export default Page;
