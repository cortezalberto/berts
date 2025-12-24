import { useState } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { Button } from './Button'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  label?: string
  error?: string
}

export function ImageUpload({
  value,
  onChange,
  label,
  error,
}: ImageUploadProps) {
  const [inputUrl, setInputUrl] = useState('')
  const [showInput, setShowInput] = useState(false)

  const handleUrlSubmit = () => {
    if (inputUrl.trim()) {
      onChange(inputUrl.trim())
      setInputUrl('')
      setShowInput(false)
    }
  }

  const handleRemove = () => {
    onChange('')
  }

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
          {label}
        </label>
      )}

      {value ? (
        <div className="relative group">
          <img
            src={value}
            alt="Preview"
            className="w-full h-40 object-cover rounded-lg border border-zinc-700"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      ) : showInput ? (
        <div className="flex gap-2">
          <input
            type="url"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleUrlSubmit()
              }
            }}
          />
          <Button type="button" onClick={handleUrlSubmit}>
            Agregar
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowInput(false)}
          >
            Cancelar
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowInput(true)}
          className={`
            w-full h-40 flex flex-col items-center justify-center gap-2
            border-2 border-dashed rounded-lg
            transition-colors duration-200
            ${
              error
                ? 'border-red-500 bg-red-500/5'
                : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600 hover:bg-zinc-800'
            }
          `}
        >
          <div className="p-3 bg-zinc-700 rounded-full">
            <Upload className="w-6 h-6 text-zinc-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-zinc-300">
              Agregar imagen
            </p>
            <p className="text-xs text-zinc-500 mt-1">URL de imagen</p>
          </div>
        </button>
      )}

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}

      {value && (
        <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
          <ImageIcon className="w-3 h-3" />
          <span className="truncate">{value}</span>
        </div>
      )}
    </div>
  )
}
