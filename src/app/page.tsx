export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center mb-8 text-gray-800">
          ご飯探索マップ
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600 text-center">
            環境構築完了！<br />
            Next.js + TypeScript + TailwindCSS + Docker環境が正常に動作しています。<br />
            <span className="text-green-600 font-semibold">ホットリロード動作確認中...</span>
          </p>
        </div>
      </div>
    </main>
  )
}