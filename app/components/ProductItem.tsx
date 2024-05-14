import { useEffect, useState } from "react"
import { ComboBox, Input, type Option } from "./form"
import { formatCurrency } from "~/utils/formatters"
import ScannerButton from "./ScannerButton"
import { useFetcher } from "@remix-run/react"

interface ProductOption extends Option {
  extra: { stock: number, price: number }
}

interface ProductItemProps {
  defaultValues?: {
    product?: ProductOption
    quantity?: number
    unitPrice?: number
  },
  errorMessages?: {
    product?: string
    quantity?: string
    unitPrice?: string
  },
}

function ProductItem ({ defaultValues, errorMessages }: ProductItemProps) {
  const [maxQuantity, setMaxQuantity] = useState<number | undefined>(undefined);
  const [product, setProduct] = useState<ProductOption | null>(null);
  const [unitPrice, setUnitPrice] = useState(defaultValues?.unitPrice || "");

  const renderProductOption = (option: ProductOption) => {
    return (
      <div title={option.label} className={option.extra.stock <= 0 ? "opacity-40" : ""}>
        <div className="truncate">
          {option.label}
        </div>
        <div className="flex justify-between text-gray-500 text-xs">
          <span>Estoque: {option.extra.stock}</span>
          <span>{formatCurrency(option.extra.price)}</span>
        </div>
      </div>
    );
  };

  const onProductChange = (option: ProductOption | null) => {
    setProduct(option);
    if (option) {
      setMaxQuantity(option.extra.stock);
      setUnitPrice(option.extra.price);
    } else {
      setMaxQuantity(undefined);
    }
  };

  const productFetcher = useProductFetcher({
    onResult: (product) => {
      if (product) {
        const { id, name: label, ...extra } = product;
        setProduct({ id, label, extra });
        setUnitPrice(extra.price);
        setMaxQuantity(extra.stock);
      } else {
        setProduct(null);
        setMaxQuantity(undefined);
        window.alert("Produto não encontrado");
      }
    },
  });

  return (
    <div className="grid md:grid-cols-3 gap-1">
      <ComboBox
        appendElement={(
          <ScannerButton
            onResult={(code) => productFetcher.loadByCode(code)}
          />
        )}
        attr={['product']}
        defaultValue={defaultValues?.product}
        errorMessage={errorMessages?.product}
        label="Produto"
        onChange={onProductChange}
        renderOption={renderProductOption}
        required={true}
        url="/app/produtos-search"
        value={product}
      />
      <Input
        attr={['quantity']}
        defaultValue={defaultValues?.quantity || 1}
        errorMessage={errorMessages?.quantity}
        label="Quantidade"
        max={maxQuantity}
        min={1}
        required={true}
        type="number"
      />
      <Input
        attr={['unitPrice']}
        defaultValue={defaultValues?.unitPrice}
        errorMessage={errorMessages?.unitPrice}
        label="Preço unitário"
        min={0}
        onChange={(e) => setUnitPrice(e.target.value)}
        required={true}
        step=".01"
        type="number"
        value={unitPrice}
      />
    </div>
  );
}

export default ProductItem;

interface Product {
  id: string,
  name: string,
  price: number,
  stock: number,
}

function useProductFetcher ({ onResult }: { onResult: (product: Product | null) => void }) {
  const [fetcherKey, setFetcherKey] = useState(Math.random().toString());
  const fetcher = useFetcher<{product: Product|null}>({ key: fetcherKey });

  const loadByCode = (code: string) => {
    fetcher.load("/app/produtos/get-by-code/" + code);
  };

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      setFetcherKey(Math.random().toString());
      onResult(fetcher.data.product);
    }
  }, [fetcher.state, fetcher.data, onResult]);

  return { loadByCode };
}
