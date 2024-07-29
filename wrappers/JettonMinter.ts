import { compile } from '@ton/blueprint';
import {
    Address,
    Builder,
    Cell,
    Contract,
    ContractProvider,
    Sender,
    SendMode,
    beginCell,
    contractAddress,
    toNano,
} from '@ton/core';
import BN from 'bn.js';

import { OPS } from './ops';

const OFFCHAIN_CONTENT_PREFIX = 0x01;

export type JettonMinterConfig = {
    totalSupply: BN;
    admin: Address;
    contentUri: string;
    tokenCode: Cell;
};

export function jettonMinterConfigToCell({ totalSupply, admin, contentUri, tokenCode }: JettonMinterConfig): Cell {
    let contentCell = beginCell()
        .storeInt(OFFCHAIN_CONTENT_PREFIX, 8)
        .storeBuffer(Buffer.from(contentUri, 'ascii'))
        .endCell();

    const data: Cell = beginCell()
        .storeCoins(totalSupply.toNumber())
        .storeAddress(admin)
        .storeRef(contentCell)
        .storeRef(tokenCode)
        .endCell();
    const dataCell: Cell = new Cell({ bits: data.bits, refs: data.refs });

    return dataCell;
}

export class JettonMinter implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell },
    ) {}

    static createFromAddress(address: Address) {
        return new JettonMinter(address);
    }

    static createFromConfig(config: JettonMinterConfig, code: Cell, workchain = 0) {
        const data = jettonMinterConfigToCell(config);
        const init = { code, data };
        return new JettonMinter(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    static async Create(totalSupply: BN, tokenAdmin: Address, content: string, balance = toNano('1')) {
        const jettonWalletCode: Cell = await serializeWalletCodeToCell();
        const jettonMinterCode: Cell = await serializeMinterCodeToCell();

        const contract = this.createFromConfig(
            {
                totalSupply,
                admin: tokenAdmin,
                contentUri: content,
                tokenCode: jettonWalletCode,
            },
            jettonMinterCode,
        );

        return contract;
    }

    static Mint(receiver: Address, jettonAmount: BN, tonAmount = toNano(0.04)) {
        const masterMessageData: Cell = beginCell()
            .storeUint(0x178d4519, 32)
            .storeUint(0, 64)
            .storeCoins(jettonAmount.toNumber())
            .storeAddress(null)
            .storeAddress(null)
            .storeCoins(0)
            .storeBit(false)
            .endCell();
        const messageBodyData: Cell = beginCell()
            .storeUint(OPS.MINT, 32)
            .storeUint(1, 64)
            .storeAddress(receiver)
            .storeCoins(tonAmount)
            .storeRef(masterMessageData)
            .endCell();

        const messageBodyCell: Cell = new Cell({ bits: messageBodyData.bits, refs: messageBodyData.refs });

        return messageBodyCell;
    }

    async mint(sender: Address, receiver: Address, jettonAmount: BN) {
        // if (!this.contract) {
        //     return;
        // }
        // let res = await this.contract.sendInternalMessage(
        //     new InternalMessage({
        //         from: sender,
        //         to: this.address as Address,
        //         value: new BN(10001),
        //         bounce: false,
        //         body: new CommonMessageInfo({
        //             body: new CellMessage(JettonMinter.Mint(receiver, jettonAmount)),
        //         }),
        //     }),
        // );

        // let successResult = res as SuccessfulExecutionResult;

        // return {
        //     ...res,
        //     returnValue: res.result[1] as BN,
        //     logs: filterLogs(res.logs),
        // };

        const masterMessageData: Cell = beginCell()
            .storeUint(0x178d4519, 32)
            .storeUint(0, 64)
            .storeCoins(jettonAmount.toNumber())
            .storeAddress(null)
            .storeAddress(null)
            .storeCoins(0)
            .storeBit(false)
            .endCell();
        const messageBodyData: Cell = beginCell()
            .storeUint(OPS.MINT, 32)
            .storeUint(1, 64)
            .storeAddress(receiver)
            .storeCoins(jettonAmount.toNumber())
            .storeRef(masterMessageData)
            .endCell();

        const messageBodyCell: Cell = new Cell({ bits: messageBodyData.bits, refs: messageBodyData.refs });

        return messageBodyCell;
    }
}

async function serializeWalletCodeToCell(): Promise<Cell> {
    return await compile('JettonWallet');
}

async function serializeMinterCodeToCell(): Promise<Cell> {
    return await compile('JettonMinter');
}
