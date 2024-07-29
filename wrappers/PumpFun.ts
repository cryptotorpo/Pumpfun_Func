import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type PumpFunConfig = {};

export function pumpFunConfigToCell(config: PumpFunConfig): Cell {
    return beginCell().endCell();
}

export class PumpFun implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new PumpFun(address);
    }

    static createFromConfig(config: PumpFunConfig, code: Cell, workchain = 0) {
        const data = pumpFunConfigToCell(config);
        const init = { code, data };
        return new PumpFun(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }
}
