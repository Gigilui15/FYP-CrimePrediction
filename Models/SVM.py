import pandas as pd
from sklearn.svm import SVR
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import optuna
from sklearn.model_selection import train_test_split

# Load the training dataset
train_data = pd.read_csv(r'C:\\Users\\luigi\\Desktop\\Third Year\\Thesis\\Artefact\\TrainTestSplit\\train_set_ordered.csv')
# Load the testing dataset
test_data = pd.read_csv(r'C:\\Users\\luigi\\Desktop\\Third Year\\Thesis\\Artefact\\TrainTestSplit\\test_set_ordered.csv')

# Split features and target for training set
X_train = train_data[['area', 'month', 'agg_id']]
y_train = train_data['total_crimes']
# Split features and target for testing set
X_test = test_data[['area', 'month', 'agg_id']]
y_test = test_data['total_crimes']

# Function to generate Fibonacci numbers within a range
def fibonacci_range(start, end):
    fibonacci = [1, 2]
    while fibonacci[-1] < end:
        next_fib = fibonacci[-1] + fibonacci[-2]
        if next_fib <= end:
            fibonacci.append(next_fib)
        else:
            break
    return [x for x in fibonacci if x >= start]

def objective(trial):
    # Define the search space for hyperparameters
    kernel = trial.suggest_categorical('kernel', [ 'linear','poly', 'rbf', 'sigmoid'])
    
    # Sample C from Fibonacci sequence
    fibonacci_c = fibonacci_range(1, 1e6)
    C = trial.suggest_categorical('C', fibonacci_c)
    
    epsilon = trial.suggest_categorical('epsilon', [0.01, 0.1, 0.5, 1, 2, 4])
 
    # Create SVR model with given hyperparameters
    svr_regressor = SVR(kernel=kernel, C=C, epsilon=epsilon)
    
    # Print the parameters of the active trial
    print("Trial Parameters - Kernel:", kernel, "C:", C, "Epsilon:", epsilon)
    
    # Train the model
    svr_regressor.fit(X_train, y_train)

    # Predict on the validation set
    y_pred = svr_regressor.predict(X_test)

    # Calculate evaluation metrics
    mse_val = mean_squared_error(y_test, y_pred)

    return mse_val


# Create a Optuna study object and optimize the objective function
study = optuna.create_study(direction='minimize')
study.optimize(objective, n_trials=50)

# Get the best hyperparameters
best_params = study.best_params
print("Best Hyperparameters:", best_params)

# Initialize SVR model with the best hyperparameters
best_svr_regressor = SVR(**best_params)

# Train the SVR model on the full training data
best_svr_regressor.fit(X_train, y_train)

# Predict on the test data
y_pred = best_svr_regressor.predict(X_test)

# Calculate evaluation metrics for testing set
mse_test = mean_squared_error(y_test, y_pred)
mae_test = mean_absolute_error(y_test, y_pred)
r2_test = r2_score(y_test, y_pred)

print("\nTesting Set Metrics:")
print("Mean Squared Error (MSE):", mse_test)
print("Mean Absolute Error (MAE):", mae_test)
print("R-squared (R2):", r2_test)