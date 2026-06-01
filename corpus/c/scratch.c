#include <stdio.h>

int factorial(int n) {
    int result = 1;

    for(int i = 1; i <= n; i++) {
        result *= i;
    }

    return result;
}

int main() {
    printf("%d\n", factorial(5));
    return 0;
}tom code here