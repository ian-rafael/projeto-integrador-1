import type { CEP } from "cep-promise";
import { useState } from "react";
import { CepInput, Input, Select } from "./form";
import stateCities from "~/assets/states-cities.json";

const stateOptions = stateCities.estados.map((data) => ({
  id: data.sigla,
  label: data.nome,
}));

function getCityOptions (state: string) {
  if (!state) return [];
  const stateData = stateCities.estados.find(({sigla}) => sigla === state);
  return stateData?.cidades || [];
}

interface AddressProps {
  defaultValues?: {
    zipcode?: string
    state?: string
    city?: string
    street?: string
    number?: number
    complement?: string
  },
  errorMessages?: {
    zipcode?: string
    state?: string
    city?: string
    street?: string
    number?: string
    complement?: string
  },
}

export interface AddressType {
  zipcode?: string
  state?: string
  city?: string
  street?: string
  number?: number
  complement?: string
}

export default function Address ({defaultValues, errorMessages}: AddressProps) {
  const [state, setState] = useState(defaultValues?.state || '');
  const [city, setCity] = useState(defaultValues?.city || '');
  const [street, setStreet] = useState(defaultValues?.street || '');
  const [number, setNumber] = useState(defaultValues?.number || '');
  const [complement, setComplement] = useState(defaultValues?.complement || '');

  const onZipCodeData = (values: CEP) => {
    setState(values.state);
    setCity(values.city);
    setStreet(values.street);
    setNumber('');
    setComplement('');
  };

  return (
    <fieldset>
      <legend>Endereço</legend>
      <div className="grid grid-cols-3 gap-1">
        <div>
          <CepInput
            attr={['zipcode']}
            defaultValue = {defaultValues?.zipcode}
            errorMessage={errorMessages?.zipcode}
            label="CEP"
            onData={onZipCodeData}
          />
        </div>
        <div>
          <Select
            options={stateOptions}
            attr={['state']}
            errorMessage={errorMessages?.state}
            label="Estado"
            onChange={(e) => setState(e.target.value)}
            value={state}
          />
        </div>
        <div>
          <Input
            attr={['city']}
            errorMessage={errorMessages?.city}
            label="Cidade"
            onChange={(e) => setCity(e.target.value)}
            type="text"
            list="cities"
            value={city}
          />
          <datalist id="cities">
            {getCityOptions(state).map((city) => <option key={city}>{city}</option>)}
          </datalist>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1">
        <div>
          <Input
            attr={['street']}
            errorMessage={errorMessages?.street}
            label="Rua"
            onChange={(e) => setStreet(e.target.value)}
            type="text"
            value={street}
          />
        </div>
        <div>
          <Input
            attr={['number']}
            errorMessage={errorMessages?.number}
            label="Número"
            onChange={(e) => setNumber(e.target.value)}
            type="number"
            value={number}
          />
        </div>
        <div>
          <Input
            attr={['complement']}
            errorMessage={errorMessages?.complement}
            label="Complemento"
            onChange={(e) => setComplement(e.target.value)}
            type="text"
            value={complement}
          />
        </div>
      </div>
    </fieldset>
  );
}
