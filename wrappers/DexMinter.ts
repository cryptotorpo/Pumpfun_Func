import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type DexMinterConfig = {};

export function dexMinterConfigToCell(config: DexMinterConfig): Cell {
    return beginCell().endCell();
}

export class DexMinter implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new DexMinter(address);
    }

    static createFromConfig(config: DexMinterConfig, code: Cell, workchain = 0) {
        const data = dexMinterConfigToCell(config);
        const init = { code, data };
        return new DexMinter(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }
}
