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
  const [state, setState] = useState(defaultValues?.state || '');
  const [city, setCity] = useState(defaultValues?.city || '');
  const [street, setStreet] = useState(defaultValues?.street || '');
  const [number, setNumber] = useState(defaultValues?.number || '');

  const onZipCodeData = (values: CEP) => {
    const message = "Preencher os dados automaticamente?\n"
      + "Estado: " + values.state + "\n"
      + "Cidade: " + values.city + "\n"
      + "Rua: " + values.street;
    if (!window.confirm(message)) return;
    setState(values.state);
    setCity(values.city);
    setStreet(values.street);
  };

  return (
    <fieldset>
      <legend>Endereço</legend>
      <div className="row">
        <div className="col">
          <CepInput
            attr={['zipcode']}
            defaultValue = {defaultValues?.zipcode}
            errorMessage={errorMessages?.zipcode}
            label="CEP"
            onData={onZipCodeData}
          />
        </div>
        <div className="col">
          <Select
            options={stateOptions}
            attr={['state']}
            errorMessage={errorMessages?.state}
            label="Estado"
            onChange={(e) => setState(e.target.value)}
            value={state}
          />
        </div>
        <div className="col">
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
      <div className="row">
        <div className="col">
          <Input
            attr={['street']}
            errorMessage={errorMessages?.street}
            label="Rua"
            onChange={(e) => setStreet(e.target.value)}
            type="text"
            value={street}
          />
        </div>
        <div className="col">
          <Input
            attr={['number']}
            errorMessage={errorMessages?.number}
            label="Número"
            onChange={(e) => setNumber(e.target.value)}
            type="number"
            value={number}
          />
        </div>
      </div>
    </fieldset>
  );
}
