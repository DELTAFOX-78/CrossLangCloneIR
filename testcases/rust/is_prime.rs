fn isPrime(n: i32) -> i32 {
    if n <= 1 {
        return 0;
    }
    let mut i = 2;
    while i * i <= n {
        if n % i == 0 {
            return 0;
        }
        i += 1;
    }
    1
}

fn main() {
    println!("{}", isPrime(29));
}
