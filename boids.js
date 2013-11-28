/**
 * Boids シミュレーションタイプのゲーム
 * @Author Junpei Tsuji (https://github.com/junpeitsuji)
 */
var BoidsSim = (function($){

	// ゲーム状態
	var GAME_CONTEXT_FLAG_GAMERUNNING = 0;
	var GAME_CONTEXT_FLAG_GAMEOVER    = 1;

	// boid の個体数
	var NUM_OF_BOIDS = 100;

	// 制限速度
	var MAXSPEED = 5;

	// 敵キャラの画像ファイルパス
	var IMAGE_PATH_ENEMY = "images/enemy.png";
	// ボイドキャラの画像ファイルパス
	var IMAGE_PATH_BOID  = "images/boid.png";

	// 1 / FPS
	var FLAME_INTERVALS = 20;


	/**
	 * ターゲット
	 */
	var Target = (function(){

		function Target(x, y) {
			this.x = x;
			this.y = y;
		}

		Target.prototype.draw = function(ctx){
	    	//canvasの状態を一旦保存
	    	ctx.save();

			ctx.fillStyle = 'rgba(0, 80, 192, 0.7)';
			ctx.beginPath();
			ctx.arc(this.x, this.y, 20, 0, Math.PI*2, false);
			ctx.fill();	
    		
    		//canvasの状態を元に戻す
    		ctx.restore();
		}

		return Target;

	})();


	/**
	 * 敵キャラ
	 */
	var Enemy = (function(){
		//画像オブジェクト
		var img = new Image();
		//画像のパス指定
		img.src = IMAGE_PATH_ENEMY;

		function Enemy(id, x, y, radious) {
			this.id = id;
			this.x  = x;
			this.y  = y;
			this.radious = radious; // 当たり判定用半径
		}

		Enemy.prototype.update = function(boids_sims){
			var dx = Math.random()*40 - 20;
			var dy = Math.random()*40 - 20;

			if( this.x+dx > 0 && this.x+dx < boids_sims.width 
				&& this.y+dy > 0 && this.y+dy < boids_sims.height ){
				this.x += dx;
				this.y += dy;
				
			}
		}

		Enemy.prototype.draw = function(ctx){
	    	//canvasの状態を一旦保存
	    	ctx.save();

    		var image_width  = img.naturalWidth;
    		var image_height = img.naturalHeight;
    	
	    	//ctx.scale(ratio, ratio);
		    //画像の縦横半分の位置へtranslate
	    	ctx.translate(this.x-image_width/2 + image_width/2, this.y- image_height/2 +image_height/2);
			
			//translateした分戻して原点を0，0に
	    	ctx.translate(-image_width/2, -image_height/2);

	    	//読み込んだimgをcanvas(c1)に貼付け
	    	ctx.drawImage(img, 0, 0);
    		
    		//canvasの状態を元に戻す
    		ctx.restore();
		}

		return Enemy;

	})();


	/**
	 * Boid
	 */
	var Boid = (function(){
		//画像オブジェクト
		var img = new Image();
		//画像のパス指定
		img.src = IMAGE_PATH_BOID;

		function Boid(id, x, y, vx, vy, alive) {
			this.id = id;
			this.x  = x;
			this.y  = y;
			this.vx = vx;
			this.vy = vy;
			this.alive = alive;
		}

		Boid.prototype.update = function(boids_sims){
			if( this.alive ){
				this.rule1(boids_sims);
				this.rule2(boids_sims);
				this.rule3(boids_sims);
				this.rule4(boids_sims);
				this.rule5(boids_sims);

				// 速さを制限する
		    	var velocity = Math.sqrt( this.vx * this.vx + this.vy * this.vy );
		    	if( velocity > MAXSPEED ){
		    		this.vx *= MAXSPEED / velocity;
		    		this.vy *= MAXSPEED / velocity; 
		    	}

			    // 位置の更新
			    this.x += this.vx;
			    this.y += this.vy;
			}
		}

		Boid.prototype.rule1 = function(boids_sims){ // すべてのBoidは群の中心に向かおうとする
			var cx = 0;
			var cy = 0;
			
			var aliveCount = 0;  // 生きている boid の数を数える

			for( var j = 0; j < boids_sims.boids.length; j++ ){
				if( this.id != j ){

					if( boids_sims.boids[j].alive ){
						cx += boids_sims.boids[ j ].x;
						cy += boids_sims.boids[ j ].y;

						aliveCount++;
					}

				}
			}

			// 残りの boids の数が 2 以上のととき
			if( aliveCount > 1 ){

				cx /= aliveCount - 1;
				cy /= aliveCount - 1;

				this.vx += ( cx - this.x ) / 1000;
				this.vy += ( cy - this.y ) / 1000;

			}
		}

		Boid.prototype.rule2 = function(boids_sims){ // 他の個体と距離をとろうとする
			var vx = 0;
			var vy = 0;

			for( var j = this.id + 1; j < boids_sims.boids.length; j++ ){

				if( boids_sims.boids[j].alive ){

					var dx = boids_sims.boids[ j ].x - this.x;
					var dy = boids_sims.boids[ j ].y - this.y;

					var dist = Math.sqrt( dx * dx + dy * dy );
					if( dist < 15 ){
						dist += 0.001;

						vx -= dx / dist;
						vy -= dy / dist;
					}

				}
			}

			this.vx += vx;
			this.vy += vy;
		}
		Boid.prototype.rule3 = function(boids_sims){ // 他の個体と向きと速度を合わせようとする
			var pvx = 0;
			var pvy = 0;

			var aliveCount = 0;  // 生きている boids の数

			for( var j = 0; j < boids_sims.boids.length; j++ ){
				if( this.id != j ){

					if( boids_sims.boids[j].alive ){
						pvx += boids_sims.boids[ j ].vx;
						pvy += boids_sims.boids[ j ].vy;

						aliveCount++;
					}

				}
			}

			// 残りの boids の数が 2 以上のととき
			if( aliveCount > 1 ) {
				pvx /= aliveCount - 1;
				pvy /= aliveCount - 1;

				this.vx += ( pvx - this.vx ) / 10;
	  			this.vy += ( pvy - this.vy ) / 10;
			}
			
		}
		Boid.prototype.rule4 = function(boids_sims){ // 移動領域を限定する
			// 壁の近くでは方向反転
			if( this.x < 10 && this.vx < 0 ){
				this.vx += 10 / ( Math.abs( this.x  ) + 1 );
			} 
			else if( this.x > boids_sims.width - 10 && this.vx > 0 ){
				this.vx -= 10 / ( Math.abs( boids_sims.width - this.x ) + 1 );
			}

			if( this.y < 10 && this.vy < 0 ){
				this.vy += 10 / ( Math.abs( this.y  ) + 1 );
			}
			else if( this.y > boids_sims.height - 10 && this.vy > 0 ){
				this.vy -= 10 / ( Math.abs( boids_sims.height - this.y ) + 1 );
			}
  
		}
		Boid.prototype.rule5 = function(boids_sims){
			var dx = boids_sims.target.x - this.x;
			var dy = boids_sims.target.y - this.y;

			var dist = Math.sqrt( dx * dx + dy * dy );

			this.vx += ( dx ) / 500;
			if( this.vx * ( dx ) < 0 ){
				this.vx += ( dx ) / 500;
			}
			this.vy += ( dy ) / 500;
			if( this.vy * ( dy ) < 0 ){
				this.vy += ( dy ) / 500;
			}
		}

		Boid.prototype.draw = function(ctx){

			if( this.alive ){
				var rad = Math.atan2(this.vy, this.vx);

		    	//canvasの状態を一旦保存
		    	ctx.save();

		 		var image_width  = img.naturalWidth;
	    		var image_height = img.naturalHeight;
	    	
			    //画像の縦横半分の位置へtranslate
		    	ctx.translate(this.x-image_width/2 + image_width/2, this.y- image_height/2 +image_height/2);
		    	//変形マトリックスに回転を適用
		    	ctx.rotate(rad);

				//translateした分戻して原点を0，0に
		    	ctx.translate(-image_width/2, -image_height/2);

			    //読み込んだimgをcanvas(c1)に貼付け
			    ctx.drawImage(img, 0, 0);
	    		//canvasの状態を元に戻す
	    		ctx.restore();

			}

		}

		return Boid;

	})();


	/**
	 * コンストラクター
	 */
	function BoidsSim(selecter){
		this.selecter = selecter;

		var canvas = document.getElementById(selecter);
		var canvasRect = canvas.getBoundingClientRect()

		this.width  = canvas.width;
		this.height = canvas.height;

		// ゲーム状態の設定
		this.gameContextFlag = GAME_CONTEXT_FLAG_GAMERUNNING; 

		// ゲームスコア
		this.score = 0;

		// 次の敵が登場するまでのスコア数
		this.appearingEnemy = 0;

		// boid の残り個体数
		this.numOfBoidsRemaining = NUM_OF_BOIDS;

		// ターゲットの初期化
		this.target = new Target(
			this.width/2,   // x
			this.height*4/5 // y
		);

		// 敵キャラ
		this.enemies = new Array(2);

		// 敵キャラの初期化
		this.enemies[0] = new Enemy(0, 100, 100, 60);
		this.enemies[1] = new Enemy(1, 500, 400, 60);


		// boid の個体を管理する配列
		this.boids = new Array(NUM_OF_BOIDS);

		// 初期処理
		for(var i=0; i<NUM_OF_BOIDS; i++){
			this.boids[i] = new Boid(
				i          // id
				, this.width/2  // x
				, this.height/2 // y
				, 0        // vx
				, 0        // vy
				, true     // alive
			);
		}

		// 描画処理
		this.draw();

		// ポインタを一時的に保存
		var pthis = this;

		// クリック処理
		$(this.selecter).click( function(event){
			pthis.target.x = event.pageX - canvasRect.left;
			pthis.target.y = event.pageY - canvasRect.top;
		});
	}

	// コンテキストを取得する関数
	function getContext(selecter) {
		var canvas = document.getElementById(selecter);
		return canvas.getContext('2d');
    };


    /**
     * シミュレーションのループ処理
     */
	BoidsSim.prototype.start = function(onUpdate, onGameover){

		var ctx = getContext(this.selecter);

		// 画面の初期化
		ctx.clearRect(0, 0, this.width, this.height);
	
		// 描画・更新・当たり判定
		this.draw()
		.update()
		.collisionDetection();

		// 更新後の状態を通知
		if(onUpdate){
			onUpdate(this.score, this.numOfBoidsRemaining);
		}
		
		// ゲームコンテキストに応じて処理を変更
		if( this.gameContextFlag == GAME_CONTEXT_FLAG_GAMERUNNING ){

			// スコアを更新
			this.score += 100;
			this.appearingEnemy += 100;

			// スコアに応じて敵キャラの出現
			if(this.appearingEnemy > 100000){
				this.enemies.push(new Enemy(
					this.enemies.length,         // id
					this.width  * Math.random(), // x
					this.height * Math.random(), // y
					60                           // radious 
				));
				this.appearingEnemy = 0;
			}

			// ポインタを一時的に保存
			var pthis = this;

			// 一定間隔で繰り返し
			setTimeout( function(){
				pthis.start(onUpdate, onGameover);
			}, FLAME_INTERVALS );			

		}
		else if( this.gameContextFlag == GAME_CONTEXT_FLAG_GAMEOVER ) {
	    	//canvasの状態を一旦保存
	    	ctx.save();

			// Game Over
			ctx.font = "72px 'ＭＳ Ｐゴシック'";
			ctx.fillStyle = "#b00";
			ctx.fillText('Game Over', this.width/2 - 180, this.height/2);
			ctx.fill();

			ctx.font = "24px 'ＭＳ Ｐゴシック'";
			ctx.fillStyle = "#b00";
			ctx.fillText('Press "f5" to restart.', this.width/2 - 100, this.height/2+80);
			ctx.fill();

			// 	ゲームオーバーを通知
			if(onGameover){
				onGameover(this.score);
			}

    		//canvasの状態を元に戻す
    		ctx.restore();
		}

		return this;
	}


	/**
	 * 当たり判定処理
	 */
	BoidsSim.prototype.collisionDetection = function() {
		var pthis = this;

		// 当たり判定
		this.boids.forEach( function(boid){
			pthis.enemies.forEach( function(enemy){
				var dist = (boid.x-enemy.x)*(boid.x-enemy.x) + (boid.y-enemy.y)*(boid.y-enemy.y);
				if( dist < enemy.radious*enemy.radious ){
					boid.alive = false;
				}
			});
		});

		// 全個体が死んだらゲームオーバー
		var aliveCount = 0;
		this.boids.forEach( function(boid){
			if( boid.alive ){
				aliveCount++;
			}
		});

		this.numOfBoidsRemaining = aliveCount;

		if( this.numOfBoidsRemaining <= 0 ) {
			this.gameContextFlag = GAME_CONTEXT_FLAG_GAMEOVER;
		}

		return this;
	}

	/**
	 * 描画処理
	 */
	BoidsSim.prototype.draw = function(){

		var ctx = getContext(this.selecter);

		// boid の描画
		this.boids.forEach( function(boid){
			boid.draw(ctx);
		});

		// 敵キャラの描画
		this.enemies.forEach( function(enemy){
			enemy.draw(ctx);
		});

		// target の描画
		this.target.draw(ctx);

		return this;
	}

	/**
	 * 更新処理
	 */
	BoidsSim.prototype.update = function(){
		
		var pthis = this;

		// boid の更新
		this.boids.forEach( function(boid){
			boid.update(pthis);
		});

		// 敵キャラの更新
		this.enemies.forEach( function(enemy){
			enemy.update(pthis);
		} );

		return this;
	}

	return BoidsSim;

})(jQuery);
