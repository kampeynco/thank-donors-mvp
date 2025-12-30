
Deno.serve(async (req) => {
    return new Response(JSON.stringify({ message: "Hello from Edge" }), {
        headers: { "Content-Type": "application/json" },
    });
});

