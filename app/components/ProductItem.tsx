import { useState } from "react"
import { ComboBox, Input, type Option } from "./form"
import { formatCurrency } from "~/utils/formatters"

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

function ProductItem ({defaultValues, errorMessages}: ProductItemProps) {
  const [maxQuantity, setMaxQuantity] = useState<number | undefined>(undefined);
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
    if (option) {
      setMaxQuantity(option.extra.stock);
      setUnitPrice(option.extra.price);
    } else {
      setMaxQuantity(undefined);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-1">
      <ComboBox
        attr={['product']}
        defaultValue={defaultValues?.product}
        errorMessage={errorMessages?.product}
        onChange={onProductChange}
        label="Produto"
        renderOption={renderProductOption}
        required={true}
        url="/app/produtos-search"
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
