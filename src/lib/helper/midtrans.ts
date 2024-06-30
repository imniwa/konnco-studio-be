
const username = process.env.MIDTRANS_SERVER_KEY as string

export async function createMidtransTransaction(
    transactionDetails: {
        order_id: string,
        gross_amount: number,
    }, itemsDetails: {
        id: string,
        name: string,
        price: number,
        quantity: number
    }[], customerDetails: {
        name: string,
        email: string,
        phone: string,
        address: string,
    }) {
    const result = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
        headers: {
            'Authorization': 'Basic ' + Buffer.from(username).toString('base64'),
            'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({
            transaction_details: {
                order_id: transactionDetails.order_id ?? `ORDER-${Math.random().toString(36).substring(7)}`,
                gross_amount: transactionDetails.gross_amount
            },
            item_details: itemsDetails,
            customer_details: customerDetails,
            enable_payments: ['credit_card'],
            credit_card: {
                secure: true,
                bank: "bca",
                installment: {
                    required: false,
                    terms: {
                        bni: [3, 6, 12],
                        mandiri: [3, 6, 12],
                        cimb: [3],
                        bca: [3, 6, 12],
                        offline: [6, 12]
                    }
                },
                whitelist_bins: [
                    "48111111",
                    "41111111"
                ]
            },
            callbacks: {
                finish: "https://demo.midtrans.com"
            },
        })
    })
    return await result.json()
}

export async function getMidtransTransactionStatus(orderId: string) {
    const result = await fetch(`https://app.sandbox.midtrans.com/v2/${orderId}/status`, {
        headers: {
            'Authorization': 'Basic ' + Buffer.from(username).toString('base64'),
            'Content-Type': 'application/json'
        },
        method: 'POST'
    })
    return await result.json()
}