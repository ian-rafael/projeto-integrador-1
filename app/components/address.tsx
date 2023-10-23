import { Input } from "./form";

interface AddressProps {
  defaultValues?: {
    zipcode?: string
    state?: string
    city?: string
    street?: string
    number?: number | string
  },
  errorMessages?: {
    zipcode?: string
    state?: string
    city?: string
    street?: string
    number?: string
  },
}

export interface AddressType {
  zipcode?: string
  state?: string
  city?: string
  street?: string
  number?: number
}

export default function Address ({defaultValues, errorMessages}: AddressProps) {
  return (
    <fieldset>
      <legend>Endereço</legend>
      <div className="row">
        <div className="col">
          <Input
            attr={['zipcode']}
            defaultValue={defaultValues?.zipcode}
            errorMessage={errorMessages?.zipcode}
            label="CEP"
            type="text"
            placeholder="xxxxx-xxx"
          />
        </div>
        <div className="col">
          <Input
            attr={['state']}
            defaultValue={defaultValues?.state}
            errorMessage={errorMessages?.state}
            label="Estado"
            type="text"
          />
        </div>
        <div className="col">
          <Input
            attr={['city']}
            defaultValue={defaultValues?.city}
            errorMessage={errorMessages?.city}
            label="Cidade"
            type="text"
          />
        </div>
      </div>
      <div className="row">
        <div className="col">
          <Input
            attr={['street']}
            defaultValue={defaultValues?.street}
            errorMessage={errorMessages?.street}
            label="Rua"
            type="text"
          />
        </div>
        <div className="col">
          <Input
            attr={['number']}
            defaultValue={defaultValues?.number}
            errorMessage={errorMessages?.number}
            label="Número"
            type="number"
          />
        </div>
      </div>
    </fieldset>
  );
}
