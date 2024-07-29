import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type DexWalletConfig = {};

export function dexWalletConfigToCell(config: DexWalletConfig): Cell {
    return beginCell().endCell();
}

export class DexWallet implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new DexWallet(address);
    }

    static createFromConfig(config: DexWalletConfig, code: Cell, workchain = 0) {
        const data = dexWalletConfigToCell(config);
        const init = { code, data };
        return new DexWallet(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }
}
