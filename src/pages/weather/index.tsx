import { useRouter } from "next/dist/client/router";
import Link from "next/link";
import React, { useRef } from "react";
import {
  SuspenseDispatch,
  SuspenseLoader,
  useSuspense,
} from "../../libs/SuspenseLoader";

export interface WeatherType {
  publishingOffice: string;
  reportDatetime: Date;
  targetArea: string;
  headlineText: string;
  text: string;
}

// Next.jsのconcurrentFeaturesが有効になっていない場合はCSRで動作
const Weather = () => {
  const weather = useSuspense<WeatherType | undefined>();
  if (!weather) return <>読み込みに失敗しました</>;
  return (
    <div>
      <h1>{weather.targetArea}</h1>
      <div>{new Date(weather.reportDatetime).toLocaleString()}</div>
      <div>{weather.headlineText}</div>
      <pre>{weather.text}</pre>
      <div>
        <Link href="/">戻る</Link>
      </div>
    </div>
  );
};

const Page = () => {
  const router = useRouter();
  if (!router.isReady) {
    console.log(router);
    throw new Promise((resolve) => setTimeout(resolve, 100));
  }
  const id = router.query["id"];
  const dispatch = useRef<SuspenseDispatch>();
  if (!id) return null;
  const loader = (id: number) =>
    fetch(
      `https://www.jma.go.jp/bosai/forecast/data/overview_forecast/${id}.json`
    )
      .then((r) => r.json())
      //1秒の遅延を仕込む
      .then(async (v) => (await new Promise((r) => setTimeout(r, 1000))) || v)
      .catch(() => undefined);
  return (
    <>
      <button onClick={() => dispatch.current()}>Reload</button>
      <SuspenseLoader
        dispatch={dispatch} //リロード用dispatch
        name={`Weather/${id}`} //SSR引き継ぎデータに名前を付ける
        loader={loader} //Promiseを返すローダー
        loaderValue={Number(id)} //ローダーに渡すパラメータ(不要なら省略可)
        fallback={<div>読み込み中</div>} //読み込み中に表示しておくコンポーネント
        onLoaded={() => console.log("読み込み完了")} //読み込み完了後に発生するイベント
      >
        <Weather />
      </SuspenseLoader>
    </>
  );
};

export default Page;
